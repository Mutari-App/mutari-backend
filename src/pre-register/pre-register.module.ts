import { Module } from '@nestjs/common'
import { PreRegisterService } from './pre-register.service'
import { PreRegisterController } from './pre-register.controller'

@Module({
  controllers: [PreRegisterController],
  providers: [PreRegisterService],
})
export class PreRegisterModule {}
