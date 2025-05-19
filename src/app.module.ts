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
import { AuthGuard } from './auth/guards/auth.guard'
import { AuthModule } from './auth/auth.module'
import { SentryModule } from '@sentry/nestjs/setup'
import { ScheduleModule } from '@nestjs/schedule'
import { ProfileModule } from './profile/profile.module'
import { ItineraryModule } from './itinerary/itinerary.module'
import { NotificationModule } from './notification/notification.module'
import { PaymentModule } from './payment/payment.module'
import { MapModule } from './map/map.module'
import { GeminiModule } from './gemini/gemini.module'
import { UmamiModule } from './umami/umami.module'
import { MeilisearchModule } from './meilisearch/meilisearch.module'
import { TourModule } from './tour/tour.module'
import { DokuModule } from './doku/doku.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    PreRegisterModule,
    StaticModule,
    EmailModule,
    AuthModule,
    ProfileModule,
    ItineraryModule,
    NotificationModule,
    PaymentModule,
    MapModule,
    GeminiModule,
    UmamiModule,
    MeilisearchModule,
    TourModule,
    DokuModule,
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
