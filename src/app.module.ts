import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PreRegisterModule } from './pre-register/pre-register.module'
import { PrismaModule } from './prisma/prisma.module'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { StaticModule } from './static/static.module'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common/common.module'
import { EmailModule } from './email/email.module'
import { AuthGuard } from './auth/auth.guard'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    PreRegisterModule,
    StaticModule,
    EmailModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
