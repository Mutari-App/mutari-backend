import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtRefreshStrategy } from './strategies/refresh.strategy'

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtRefreshStrategy],
})
export class AuthModule {}
