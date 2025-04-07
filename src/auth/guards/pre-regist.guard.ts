import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class PreRegistGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const launchingDate = new Date(
      process.env.LAUNCHING_DATE || '2025-01-22T00:00:00'
    )
    const now = new Date()

    // Cek apakah controller harus aktif sebelum atau sesudah launchingDate
    const isBeforeLaunch = this.reflector.get<boolean>(
      'preRegistOnly',
      context.getClass()
    )

    if (isBeforeLaunch) {
      // Jika controller ini hanya boleh aktif sebelum launchingDate
      if (now < launchingDate) return true
      throw new ForbiddenException('This endpoint is no longer available')
    } else {
      // Jika controller hanya boleh aktif setelah launchingDate
      if (now >= launchingDate) return true
      throw new ForbiddenException('Not yet available')
    }
  }
}
