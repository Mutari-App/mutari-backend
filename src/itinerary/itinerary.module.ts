import { Module } from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { ItineraryController } from './itinerary.controller'
import { NotificationModule } from 'src/notification/notification.module'

@Module({
  controllers: [ItineraryController],
  providers: [ItineraryService],
  imports: [NotificationModule],
})
export class ItineraryModule {}
