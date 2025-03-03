import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { User } from '@prisma/client'

@Injectable()
export class ItineraryService {
  constructor(private readonly prisma: PrismaService) {}

  async createItinerary(data: CreateItineraryDto, user: User) {
    // Validate dates
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format')
    }

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date')
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

    // Create the itinerary with sections and blocks in a single transaction
    return this.prisma.$transaction(async (prisma) => {
      // Step 1: Create the main itinerary
      const itinerary = await prisma.itinerary.create({
        data: {
          userId: user.id,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          startDate: startDate,
          endDate: endDate,
          // Step 2: Create tags if provided
          tags: data.tags?.length
            ? {
                create: data.tags.map((tagId) => ({
                  tag: {
                    connect: { id: tagId },
                  },
                })),
              }
            : undefined,
          // Step 3: Create sections with their blocks
          sections: {
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
        // Include related data in the response
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
}
