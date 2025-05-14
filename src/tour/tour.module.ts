import { Module } from '@nestjs/common'
import { TourService } from './tour.service'
import { TourController } from './tour.controller'
import { MeilisearchModule } from 'src/meilisearch/meilisearch.module'

@Module({
  controllers: [TourController],
  providers: [TourService],
  imports: [MeilisearchModule],
})
export class TourModule {}
