import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDTO } from './dto/login.dto'
import { Public } from 'src/common/decorators/public.decorator'
import { ResponseUtil } from 'src/common/utils/response.util'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    const loginResponse = await this.authService.login(loginDto)

    return this.responseUtil.response(
      {
        message: 'Success Login',
        statusCode: 200,
      },
      {
        data: loginResponse,
      }
    )
  }
}
