import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User } from '@prisma/client'

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}
  async createItinerary(data: CreateItineraryDto, user: User) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format')
    }

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date')
    }

    if (!data.sections || data.sections.length === 0) {
      throw new BadRequestException('At least one section is required')
    }

    const sectionNumbers = data.sections.map((section) => section.sectionNumber)
    if (new Set(sectionNumbers).size !== sectionNumbers.length) {
      throw new BadRequestException('Duplicate section numbers are not allowed')
    }

    if (data.tags && data.tags.length > 0) {
      const existingTags = await this.prisma.tag.findMany({
        where: {
          id: {
            in: data.tags,
          },
        },
      })

      if (existingTags.length !== data.tags.length) {
        throw new NotFoundException('One or more tags do not exist')
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const itinerary = await prisma.itinerary.create({
        data: {
          userId: user.id,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          startDate: startDate,
          endDate: endDate,
          tags: data.tags?.length
            ? {
                create: data.tags.map((tagId) => ({
                  tag: {
                    connect: { id: tagId },
                  },
                })),
              }
            : undefined,
          sections: {
            create: data.sections.map((section) => ({
              sectionNumber: section.sectionNumber,
              title: section.title || `Hari ke-${section.sectionNumber}`,
              blocks: {
                create:
                  section.blocks && section.blocks.length > 0
                    ? section.blocks.map((block, index) => ({
                        position: index,
                        blockType: block.blockType,
                        title: block.title,
                        description: block.description,
                        startTime: block.startTime
                          ? new Date(block.startTime)
                          : null,
                        endTime: block.endTime ? new Date(block.endTime) : null,
                        location: block.location,
                        price: block.price || 0,
                        photoUrl: block.photoUrl,
                      }))
                    : [],
              },
            })),
          },
        },
        include: {
          sections: {
            include: {
              blocks: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      })
      return itinerary
    })
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
}
