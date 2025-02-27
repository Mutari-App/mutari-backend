import { Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDTO } from './dto/login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(loginDto: LoginDTO) {
    const loginResponse = null
    return loginResponse
  }
}
