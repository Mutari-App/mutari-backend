import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService, TokenExpiredError } from '@nestjs/jwt'
import { Request } from 'express'
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true
    const request = context.switchToHttp().getRequest()

    if (request.path === '/metrics') return true

    const launchingDate = new Date(
      process.env.LAUNCHING_DATE || '2025-01-22T00:00:00'
    )
    const now = new Date()
    const isLaunching = now > launchingDate

    const rawToken = isLaunching
      ? request.cookies.accessToken
      : this.extractTokenFromHeader(request)
    if (!rawToken) {
      throw new UnauthorizedException('token not provided')
    }

    try {
      const token = this.jwtService.verify(rawToken, {
        secret: process.env.JWT_SECRET,
      })
      const user = await this.prisma.user.findUnique({
        where: { id: isLaunching ? token.userId : token.sub },
      })

      if (!user) {
        throw new UnauthorizedException('Invalid Token')
      }
      delete user.password
      request['user'] = user
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('token has expired')
      } else {
        throw new UnauthorizedException(err.message)
      }
    }
    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
