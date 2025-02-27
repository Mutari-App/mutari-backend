import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}

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

  async removeItinerary(id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
    })
    if (!itinerary) {
      throw new NotFoundException('Itinerary not found')
    }

    return this.prisma.itinerary.delete({
      where: { id },
    })
  }
}
