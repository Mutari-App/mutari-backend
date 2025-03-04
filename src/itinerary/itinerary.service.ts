import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User } from '@prisma/client'

@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) {}

  async updateItinerary(id: string, data: UpdateItineraryDto, user: User) {
    const existingItinerary = await this.prisma.itinerary.findUnique({
      where: { id },
    })

    if (!existingItinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`)
    }

    if (existingItinerary.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this itinerary'
      )
    }

    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format')
    }

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date')
    }

    // Validate block dates order
    for (var section of data.sections) {
      for (var block of section.blocks) {
        const startTime = new Date(block.startTime)
        const endTime = new Date(block.endTime)

        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
          if (startTime > endTime) {
            throw new BadRequestException('Block start time must be before end time')
          }
        }
      }
    }

    // Validate sections
    if (!data.sections || data.sections.length === 0) {
      throw new BadRequestException('At least one section is required')
    }

    // Check for duplicate section numbers
    const sectionNumbers = data.sections.map((section) => section.sectionNumber)
    if (new Set(sectionNumbers).size !== sectionNumbers.length) {
      throw new BadRequestException('Duplicate section numbers are not allowed')
    }

    // Validate tags if provided
    if (data.tags && data.tags.length > 0) {
      // Check if all tags exist
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

    // Update itinerary with id
    return this.prisma.$transaction(async (prisma) => {
      const updatedItinerary = await this.prisma.itinerary.update({
        where: { id, userId: user.id },
        data: {
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          startDate: startDate,
          endDate: endDate,

          tags: data.tags?.length
          ? {
              set: [],
              create: data.tags.map((tagId) => ({
                tag: {
                  connect: { id: tagId },
                },
              })),
            }
          : undefined,
            
          sections: {
            deleteMany: {},
            create: data.sections.map((section) => ({
              sectionNumber: section.sectionNumber,
              title: section.title || `Hari ke-${section.sectionNumber}`,
              // Step 4: Create blocks within each section
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

      return updatedItinerary
    })
  }
}
