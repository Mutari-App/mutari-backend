import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User, Prisma } from '@prisma/client'

@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) {}

  async createItinerary(data: CreateItineraryDto, user: User) {
    try {
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
      const sectionNumbers = data.sections.map(
        (section) => section.sectionNumber
      )
      if (new Set(sectionNumbers).size !== sectionNumbers.length) {
        throw new BadRequestException(
          'Duplicate section numbers are not allowed'
        )
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
                          endTime: block.endTime
                            ? new Date(block.endTime)
                            : null,
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
    } catch (error) {
      // Handle different types of Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('There is a unique constraint violation')
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            'Foreign key constraint failed, related record does not exist'
          )
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Record to connect to does not exist')
        }
      }

      // If it's already an HTTP exception, rethrow it
      if (error.status) {
        throw error
      }

      // Log the unknown error
      console.error('Unexpected error creating itinerary:', error)
      throw new InternalServerErrorException(
        'An unexpected error occurred while creating the itinerary'
      )
    }
  }

  async updateItinerary(id: string, data: UpdateItineraryDto, user: User) {
    const existingItinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: { sections: { include: { blocks: true } }, tags: true },
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
        where: { id },
        data: {
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
            deleteMany: { itineraryId: id },
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
        include: { sections: { include: { blocks: true } }, tags: true },
      })

      return updatedItinerary
    })
  }
}
