import { Module } from '@nestjs/common'
import { DokuService } from './doku.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [DokuService],
  exports: [DokuService],
})
export class DokuModule {}
