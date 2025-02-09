import { Module } from '@nestjs/common'
import { PreRegisterService } from './pre-register.service'
import { PreRegisterController } from './pre-register.controller'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '30m' },
    }),
  ],
  controllers: [PreRegisterController],
  providers: [PreRegisterService],
})
export class PreRegisterModule {}
