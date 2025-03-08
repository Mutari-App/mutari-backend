import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDTO } from './dto/login.dto'
import { Public } from 'src/common/decorators/public.decorator'
import { ResponseUtil } from 'src/common/utils/response.util'
import { RefreshAuthGuard } from './guards/refresh-auth.guard'
import { Request, Response } from 'express'
import { User } from '@prisma/client'
import { COOKIE_CONFIG } from './constant'
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
}
