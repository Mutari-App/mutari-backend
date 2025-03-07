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

  async findOne(id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: id },
      include: {
        sections: {
          include: {
            blocks: true,
          },
        },
      },
    })
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`)
    }
    return itinerary
  }

  update(id: number, updateItineraryDto: UpdateItineraryDto) {
    return `This action updates a #${id} itinerary`
  }

  remove(id: number) {
    return `This action removes a #${id} itinerary`
  }
}
