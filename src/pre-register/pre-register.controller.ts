import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { PreRegisterService } from './pre-register.service'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { LoginDTO } from './dto/login.dto'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { User } from '@prisma/client'
import { Public } from 'src/common/decorators/public.decorator'
import { PreRegistGuard } from 'src/auth/guards/pre-regist.guard'
import { PreRegistOnly } from 'src/common/decorators/preRegistOnly.decorator'

@UseGuards(PreRegistGuard)
@PreRegistOnly()
@Controller('pre-register')
export class PreRegisterController {
  constructor(private readonly preRegisterService: PreRegisterService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post()
  async preRegister(@Body() preRegisterDto: PreRegisterDTO) {
    return this.preRegisterService.createPreRegister(preRegisterDto)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('count')
  async getPreRegisterCount() {
    return this.preRegisterService.getPreRegisterCount()
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() loginDto: LoginDTO) {
    return this.preRegisterService.login(loginDto.email)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('/login/validate/:ticketId')
  async validateLogin(@Param('ticketId') ticketId: string) {
    return this.preRegisterService.validateLogin(ticketId)
  }

  @HttpCode(HttpStatus.OK)
  @Get('/referral-code')
  async referralCode(@GetUser() user: User) {
    return this.preRegisterService.getReferralCode(user.id)
  }
}
