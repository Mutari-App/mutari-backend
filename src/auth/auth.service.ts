import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma/prisma.service'
import { LoginDTO } from './dto/login.dto'
import { ResponseUtil } from 'src/common/utils/response.util'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly responseUtil: ResponseUtil
  ) {}

  async login(loginDto: LoginDTO) {
    return null
  }
}
