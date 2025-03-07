import {
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyItineraries(userId: string, page: number) {
    if (page < 1) throw new HttpException('Invalid page number', 400)

    const limit = PAGINATION_LIMIT
    const skip = (page - 1) * limit

    const [data, total] = await this.prisma.$transaction([
      this.prisma.itinerary.findMany({
        where: { userId, isCompleted: false },
        take: limit,
        skip,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.itinerary.count({ where: { userId, isCompleted: false } }),
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

  async findMyCompletedItineraries(userId: string) {
    const completedItineraries = await this.prisma.itinerary.findMany({
      where: { userId, isCompleted: true },
      orderBy: { startDate: 'asc' },
      include: {
        sections: {
          include: {
            blocks: {
              where: { blockType: 'LOCATION' }, // Hanya ambil blocks yang punya blockType = LOCATION
            },
          },
        },
      },
    })

    return completedItineraries.map((itinerary) => ({
      ...itinerary, // Ambil semua data itinerary (id, title, dsb.)
      locationCount: itinerary.sections.reduce(
        (acc, section) => acc + section.blocks.length,
        0
      ), // Hitung total block dengan type LOCATION
    }))
  }

  async markAsComplete(itineraryId: string, userId: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
    })

    if (!itinerary)
      throw new NotFoundException(
        `Itinerary with id ${itineraryId} does not exist.`
      )

    if (itinerary.userId !== userId) {
      throw new ForbiddenException(
        `You are not authorized to update this itinerary.`
      )
    }

    return await this.prisma.itinerary.update({
      where: { id: itineraryId },
      data: { isCompleted: true },
    })
  }
}
