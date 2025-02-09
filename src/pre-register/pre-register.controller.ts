import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { PreRegisterService } from './pre-register.service'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { LoginDTO } from './dto/login.dto'

@Controller('pre-register')
export class PreRegisterController {
  constructor(private readonly preRegisterService: PreRegisterService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  async preRegister(@Body() preRegisterDto: PreRegisterDTO) {
    return this.preRegisterService.createPreRegister(preRegisterDto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('count')
  async getPreRegisterCount() {
    return this.preRegisterService.getPreRegisterCount()
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(@Body() loginDto: LoginDTO) {
    return this.preRegisterService.login(loginDto.email)
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login/validate/:tokenId')
  async validateLogin(@Param('tokenId') tokenId: string) {
    return this.preRegisterService.validateLogin(tokenId)
  }
}
