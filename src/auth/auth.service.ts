import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma/prisma.service'
import { LoginDTO } from './dto/login.dto'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginDto: LoginDTO) {
    const { email, password } = loginDto

    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Incorrect Email or Password')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect Email or Password')
    }

    const accessToken = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
    )

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
    )

    return { accessToken, refreshToken }
  }
}
