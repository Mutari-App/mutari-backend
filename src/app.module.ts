import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PreRegisterModule } from './pre-register/pre-register.module'
import { PrismaModule } from './prisma/prisma.module'
import { APP_FILTER } from '@nestjs/core'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { StaticModule } from './static/static.module'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common/common.module'
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    PreRegisterModule,
    StaticModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
