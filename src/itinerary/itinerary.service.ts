import { HttpException, Injectable } from '@nestjs/common'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}

  create(createItineraryDto: CreateItineraryDto) {
    return 'This action adds a new itinerary'
  }

  findAll() {
    return `This action returns all itinerary`
  }

  async findMyItineraries(userId: string, page: number) {
    if (page < 1) throw new HttpException('Invalid page number', 400)

    const limit = PAGINATION_LIMIT
    const skip = (page - 1) * limit

    const [data, total] = await this.prisma.$transaction([
      this.prisma.itinerary.findMany({
        where: { userId },
        take: limit,
        skip,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.itinerary.count({ where: { userId } }),
    ])

    const totalPages =
      Math.ceil(total / limit) < 1 ? 1 : Math.ceil(total / limit)
    if (page > totalPages)
      throw new HttpException('Page number exceeds total available pages', 400)

    return {
      data,
      metadata: {
        total,
        page,
        totalPages,
      },
    }
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
