import {
  HttpException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User } from '@prisma/client'
import { CreateSectionDto } from './dto/create-section.dto'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'
import { PrismaService } from 'src/prisma/prisma.service'

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

  async updateItinerary(id: string, data: UpdateItineraryDto, user: User) {
    await this._checkItineraryExists(id, user)
    this._validateItineraryDates(data)
    this._validateItinerarySections(data)
    await this._validateItineraryTags(data)

    // Update itinerary with id
    return this.prisma.$transaction(async (prisma) => {
      const updatedItinerary = await prisma.itinerary.update({
        where: { id, userId: user.id },
        data: {
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),

          tags: {
            deleteMany: { itineraryId: id },
            create: data.tags?.map((tagId) => ({
              tag: {
                connect: { id: tagId },
              },
            })),
          },

          sections: {
            deleteMany: { itineraryId: id },
            create: this._generateBlockFromSections(data.sections),
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

  async _checkItineraryExists(id: string, user: User) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`)
    }

    if (itinerary.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update or view this itinerary'
      )
    }

    return itinerary
  }

  _validateItineraryDates(data: UpdateItineraryDto) {
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
    for (let section of data.sections) {
      for (let block of section.blocks) {
        const startTime = new Date(block.startTime)
        const endTime = new Date(block.endTime)

        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
          if (startTime > endTime) {
            throw new BadRequestException(
              'Block start time must be before end time'
            )
          }
        }
      }
    }
  }

  _validateItinerarySections(data: UpdateItineraryDto) {
    // Validate sections
    if (!data.sections || data.sections.length === 0) {
      throw new BadRequestException('At least one section is required')
    }

    // Check for duplicate section numbers
    const sectionNumbers = data.sections.map((section) => section.sectionNumber)
    if (new Set(sectionNumbers).size !== sectionNumbers.length) {
      throw new BadRequestException('Duplicate section numbers are not allowed')
    }
  }

  async _validateItineraryTags(data: UpdateItineraryDto) {
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
  }

  _generateBlockFromSections = (sections: CreateSectionDto[]) => {
    return sections.map((section) => ({
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
                startTime: block.startTime ? new Date(block.startTime) : null,
                endTime: block.endTime ? new Date(block.endTime) : null,
                location: block.location,
                price: block.price || 0,
                photoUrl: block.photoUrl,
              }))
            : [],
      },
    }))
  }

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
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' }, // Ambil hanya block dengan blockType = LOCATION
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      this.prisma.itinerary.count({ where: { userId, isCompleted: false } }),
    ])

    const formattedData = data.map((itinerary) => ({
      ...itinerary,
      locationCount: itinerary.sections.reduce(
        (acc, section) => acc + section.blocks.length,
        0
      ), // Hitung total block LOCATION
    }))

    const totalPages =
      Math.ceil(total / limit) < 1 ? 1 : Math.ceil(total / limit)
    if (page > totalPages)
      throw new HttpException('Page number exceeds total available pages', 400)

    return {
      data: formattedData,
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
        tags: {
          include: {
            tag: true,
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
  async findOne(id: string, user: User) {
    await this._checkItineraryExists(id, user)
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: id },
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

  async findAllTags() {
    const tags = await this.prisma.tag.findMany({
      orderBy: {
        name: 'asc',
      },
    })
    return tags
  }

  async inviteToItinerary(
    itineraryId: string,
    emails: string[],
    userId: string
  ) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
    }

    if (itinerary.userId !== userId) {
      throw new ForbiddenException(
        'Not authorized to invite users to this itinerary'
      )
    }

    const pendingItineraryInvites =
      await this.prisma.pendingItineraryInvite.createMany({
        data: emails.map((email) => ({
          itineraryId: itinerary.id,
          email,
        })),
        skipDuplicates: true,
      })

    return pendingItineraryInvites
  }

  async acceptItineraryInvitation(
    pendingItineraryInviteId: string,
    user: User
  ) {
    const pendingInvite = await this.prisma.pendingItineraryInvite.findUnique({
      where: { id: pendingItineraryInviteId },
    })

    if (!pendingInvite) {
      throw new NotFoundException(
        `Invitation with ID ${pendingItineraryInviteId} not found`
      )
    }

    if (pendingInvite.email === user.email) {
      throw new ForbiddenException(
        'You are not authorized to accept this invitation'
      )
    }

    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: pendingInvite.itineraryId },
    })

    if (!itinerary) {
      throw new NotFoundException(
        `Itinerary with ID ${pendingInvite.itineraryId} not found`
      )
    }

    const newItineraryAccess = await this.prisma.$transaction(
      async (prisma) => {
        const newItineraryAccess = await prisma.itineraryAccess.create({
          data: {
            itineraryId: pendingInvite.itineraryId,
            userId: user.id,
          },
        })

        await prisma.pendingItineraryInvite.delete({
          where: { id: pendingItineraryInviteId },
        })
        return newItineraryAccess
      }
    )

    return newItineraryAccess
  }
}
