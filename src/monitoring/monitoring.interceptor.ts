import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Counter } from 'prom-client'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total') private requestCounter: Counter
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()

    return next.handle().pipe(
      tap(() => {
        const method = req.method
        const route = req.route?.path || req.url
        const status = req.res?.statusCode || 500

        this.requestCounter.inc({
          method,
          route,
          status: status.toString(),
        })
      })
    )
  }
}
