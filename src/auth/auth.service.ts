import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma/prisma.service'
import { LoginDTO } from './dto/login.dto'
import * as bcrypt from 'bcryptjs'
import { User } from '@prisma/client'

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

    const accessToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    const refreshToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }
    )

    return { accessToken, refreshToken }
  }

  private isRefreshTokenBlackListed(refreshToken: string, userId: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId,
      },
    })
  }

  async refreshToken(
    user: User,
    currentRefreshToken: string,
    currentRefreshTokenExpiresAt: Date
  ) {
    if (await this.isRefreshTokenBlackListed(currentRefreshToken, user.id)) {
      throw new UnauthorizedException('Invalid refresh token.')
    }

    const newRefreshToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }
    )

    await this.prisma.refreshToken.create({
      data: {
        token: currentRefreshToken,
        expiresAt: currentRefreshTokenExpiresAt,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })

    const accessToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    return {
      accessToken,
      refreshToken: newRefreshToken,
    }
  }
}
