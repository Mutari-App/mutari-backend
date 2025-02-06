import { Controller, Post, Get, Body } from '@nestjs/common'
import { PreRegisterService } from './pre-register.service'
import { PreRegisterDTO } from './dto/pre-register.dto'

@Controller('pre-register')
export class PreRegisterController {
  constructor(private readonly preRegisterService: PreRegisterService) {}

  @Post()
  async preRegister(@Body() preRegisterDto: PreRegisterDTO) {
    return this.preRegisterService.createPreRegister(preRegisterDto)
  }

  @Get('count')
  async getPreRegisterCount() {
    return this.preRegisterService.getPreRegisterCount()
  }
}
