import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class TourService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
    })

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`)
    }

    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: tour.itineraryId },
      include: {
        sections: {
          include: {
            blocks: true,
          },
        },
      },
    })

    const includes = await this.prisma.tourIncludes.findMany({
      where: { tourId: id },
    })

    const result = {
      ...tour,
      itinerary: itinerary ? { ...itinerary } : null,
      includes,
    }

    return result
  }
}
