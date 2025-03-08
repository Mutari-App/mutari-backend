import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Public } from 'src/common/decorators/public.decorator'
import { CreateUserDTO } from './dto/create-user-dto'
import { RegisterDTO } from './dto/register-dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { VerifyRegistrationDTO } from './dto/verify-registration-dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('/createUser')
  async createUser(@Body() data: CreateUserDTO) {
    await this.authService.createUser(data)
    await this.authService.sendVerification(data)
    return this.responseUtil.response({
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully. Please verify your email',
    })
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/verify')
  async verify(@Body() data: VerifyRegistrationDTO) {
    await this.authService.verify(data)
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Verification successful',
    })
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/register')
  async register(@Body() data: RegisterDTO) {
    await this.authService.register(data)
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Registration successful',
    })
  }
}
