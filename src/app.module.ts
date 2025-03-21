import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PreRegisterModule } from './pre-register/pre-register.module'
import { PrismaModule } from './prisma/prisma.module'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { StaticModule } from './static/static.module'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common/common.module'
import { EmailModule } from './email/email.module'
import { AuthGuard } from './auth/guards/auth.guard'
import { AuthModule } from './auth/auth.module'
import { SentryModule } from '@sentry/nestjs/setup'
import { ProfileModule } from './profile/profile.module'
import { ItineraryModule } from './itinerary/itinerary.module'
import { NotificationModule } from './notification/notification.module'
import { PaymentModule } from './payment/payment.module'
import { TicketModule } from './ticket/ticket.module'
import { MapModule } from './map/map.module'
import {
  makeCounterProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus'
import { MonitoringModule } from './monitoring/monitoring.module'
import { MonitoringInterceptor } from './monitoring/monitoring.interceptor'

@Module({
  imports: [
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
    TicketModule,
    MapModule,
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
    }),
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    { provide: APP_GUARD, useClass: AuthGuard },
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    }),
    {
      provide: APP_INTERCEPTOR,
      useClass: MonitoringInterceptor,
    },
  ],
})
export class AppModule {}
