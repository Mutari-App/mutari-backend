import { Injectable } from '@nestjs/common'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'

@Injectable()
export class ItineraryService {
  create(createItineraryDto: CreateItineraryDto) {
    return 'This action adds a new itinerary'
  }

  findAll() {
    return `This action returns all itinerary`
  }

  findOne(id: number) {
    return `This action returns a #${id} itinerary`
  }

  update(id: number, updateItineraryDto: UpdateItineraryDto) {
    return `This action updates a #${id} itinerary`
  }

  remove(id: number) {
    return `This action removes a #${id} itinerary`
  }
}
