import {
  Body,
  Controller,
  Post,
  UseGuards,
  Res,
  Req,
  HttpStatus,
  Get,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDTO } from './dto/login.dto'
import { Public } from 'src/common/decorators/public.decorator'
import { ResponseUtil } from 'src/common/utils/response.util'
import { RefreshAuthGuard } from './guards/refresh-auth.guard'
import { Request, Response } from 'express'
import { User } from '@prisma/client'
import { COOKIE_CONFIG } from './constant'
import { RegisterDTO } from './dto/register.dto'
import { VerifyRegistrationDTO } from './dto/verify-registration.dto'
import { CreateUserDTO } from './dto/create-user.dto'
import { PreRegistGuard } from './guards/pre-regist.guard'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { RequestPasswordResetDTO } from './dto/request-pw-reset.dto'
import { VerifyPasswordResetDTO } from './dto/verify-pw-reset.dto'

@UseGuards(PreRegistGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDTO,
    @Res({ passthrough: true }) res: Response
  ) {
    const loginResponse = await this.authService.login(loginDto)
    res.cookie(COOKIE_CONFIG.accessToken.name, loginResponse.accessToken, {
      ...COOKIE_CONFIG.accessToken.options,
    })
    res.cookie(COOKIE_CONFIG.refreshToken.name, loginResponse.refreshToken, {
      ...COOKIE_CONFIG.refreshToken.options,
    })
    return this.responseUtil.response({
      message: 'Success Login',
      statusCode: 200,
    })
  }

  @Public()
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
  @UseGuards(RefreshAuthGuard)
  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.refreshToken(
      (req.user as any).user as User,
      req.cookies.refreshToken,
      (req.user as any).refreshTokenExpiresAt
    )

    res.cookie(COOKIE_CONFIG.accessToken.name, tokens.accessToken, {
      ...COOKIE_CONFIG.accessToken.options,
    })
    res.cookie(COOKIE_CONFIG.refreshToken.name, tokens.refreshToken, {
      ...COOKIE_CONFIG.refreshToken.options,
    })

    return this.responseUtil.response({
      message: 'Success get Refresh Token',
      statusCode: 200,
    })
  }

  @Public()
  @Post('/verify')
  async verify(@Body() data: VerifyRegistrationDTO) {
    await this.authService.verify(data)
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Verification successful',
    })
  }

  @Public()
  @Post('/register')
  async register(@Body() data: RegisterDTO) {
    await this.authService.register(data)
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Registration successful',
    })
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_CONFIG.refreshToken.name, {
      ...COOKIE_CONFIG.refreshToken.options,
    })
    res.clearCookie(COOKIE_CONFIG.accessToken.name, {
      ...COOKIE_CONFIG.refreshToken.options,
    })

    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Success Logout',
    })
  }

  @Get('me')
  getme(@GetUser() user: User) {
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'User fetched successfully.',
      },
      {
        user,
      }
    )
  }

  @Public()
  @Post('requestPasswordReset')
  async requestPasswordReset(@Body() data: RequestPasswordResetDTO) {
    await this.authService.sendPasswordResetVerification(data)
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Sent verification code to email',
    })
  }

  @Public()
  @Post('verifyPasswordReset')
  async verifyPasswordReset(@Body() data: VerifyPasswordResetDTO) {
    await this.authService.verifyPasswordReset(data)
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Verification successful',
    })
  }
}
