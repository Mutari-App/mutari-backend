import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { RefreshStrategy } from './strategies/refresh.strategy'

@Module({
  controllers: [AuthController],
  providers: [AuthService, RefreshStrategy],
})
export class AuthModule {}
