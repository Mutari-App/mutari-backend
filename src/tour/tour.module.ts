import { Module } from '@nestjs/common'
import { TourService } from './tour.service'
import { TourController } from './tour.controller'
import { MeilisearchModule } from 'src/meilisearch/meilisearch.module'
import { MidtransModule } from 'src/midtrans/midtrans.module'
import { DokuModule } from 'src/doku/doku.module'

@Module({
  controllers: [TourController],
  providers: [TourService],
  imports: [MeilisearchModule, MidtransModule, DokuModule],
})
export class TourModule {}
