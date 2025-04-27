import { Module } from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { ItineraryController } from './itinerary.controller'
import { NotificationModule } from 'src/notification/notification.module'
import { MeilisearchModule } from 'src/meilisearch/meilisearch.module'

@Module({
  controllers: [ItineraryController],
  providers: [ItineraryService],
  imports: [NotificationModule, MeilisearchModule],
})
export class ItineraryModule {}
