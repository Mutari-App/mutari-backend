import { Module } from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { ItineraryController } from './itinerary.controller'

@Module({
  controllers: [ItineraryController],
  providers: [ItineraryService],
})
export class ItineraryModule {}
