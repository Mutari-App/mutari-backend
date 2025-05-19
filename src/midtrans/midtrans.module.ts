import { Module } from '@nestjs/common'
import { MidtransService } from './midtrans.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [MidtransService],
  exports: [MidtransService],
})
export class MidtransModule {}
