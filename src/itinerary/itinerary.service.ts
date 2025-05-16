import {
  HttpException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User, TRANSPORT_MODE } from '@prisma/client'
import { CreateSectionDto } from './dto/create-section.dto'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'
import { PrismaService } from 'src/prisma/prisma.service'
import { EmailService } from 'src/email/email.service'
import { invitationTemplate } from './templates/invitation-template'
import { CreateContingencyPlanDto } from './dto/create-contingency-plan.dto'
import { UpdateContingencyPlanDto } from './dto/update-contingency-plan.dto'
import { MeilisearchService } from '../meilisearch/meilisearch.service'

@Injectable()
export class ItineraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly meilisearchService: MeilisearchService
  ) {}
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
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoProfile: true,
            },
          },
        },
      })

      // Create routes between blocks if they exist
      if (data.sections && data.sections.length > 0) {
        for (const section of data.sections) {
          if (section.blocks && section.blocks.length > 0) {
            const createdBlocks =
              itinerary.sections.find(
                (s) => s.sectionNumber === section.sectionNumber
              )?.blocks || []

            // Create route mappings by position
            const blocksByPosition = new Map()
            createdBlocks.forEach((block) => {
              blocksByPosition.set(block.position, block)
            })

            // Process routes
            for (let i = 0; i < section.blocks.length; i++) {
              const block = section.blocks[i]
              const createdBlock = blocksByPosition.get(i)

              if (!createdBlock) continue

              // Create route to next if it exists
              if (block.routeToNext) {
                const nextBlock = blocksByPosition.get(i + 1)
                if (nextBlock) {
                  await prisma.route.create({
                    data: {
                      sourceBlockId: createdBlock.id,
                      destinationBlockId: nextBlock.id,
                      distance: block.routeToNext.distance,
                      duration: block.routeToNext.duration,
                      polyline: block.routeToNext.polyline,
                      transportMode:
                        block.routeToNext.transportMode || TRANSPORT_MODE.DRIVE,
                    },
                  })
                }
              }
            }
          }
        }
      }

      if (itinerary.isPublished) {
        this.meilisearchService.addOrUpdateItinerary(itinerary)
      }

      return itinerary
    })
  }

  async updateItinerary(id: string, data: UpdateItineraryDto, user: User) {
    await this._checkUpdateItineraryPermission(id, user)
    this._validateItineraryDates(data)
    this._validateItinerarySections(data)
    await this._validateItineraryTags(data)

    // Update itinerary with id
    return this.prisma.$transaction(async (prisma) => {
      // Collect all block IDs to delete routes
      const existingItinerary = await prisma.itinerary.findUnique({
        where: { id },
        include: {
          sections: {
            where: {
              contingencyPlanId: null,
            },
            include: {
              blocks: {
                include: {
                  routeToNext: true,
                  routeFromPrevious: true,
                },
              },
            },
          },
        },
      })

      // Delete existing routes first
      for (const section of existingItinerary.sections) {
        for (const block of section.blocks) {
          if (block.routeToNext) {
            await prisma.route.delete({
              where: { sourceBlockId: block.id },
            })
          }
        }
      }

      // Update the itinerary
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
            deleteMany: { itineraryId: id, contingencyPlanId: null },
            create: this._generateBlockFromSections(data.sections),
          },
        },
        include: {
          likes: true,
          sections: {
            include: {
              blocks: {
                include: {
                  routeToNext: true,
                  routeFromPrevious: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoProfile: true,
            },
          },
        },
      })

      // Create new routes
      if (data.sections && data.sections.length > 0) {
        for (const sectionDto of data.sections) {
          if (sectionDto.blocks && sectionDto.blocks.length > 0) {
            const createdSection = updatedItinerary.sections.find(
              (s) => s.sectionNumber === sectionDto.sectionNumber
            )

            if (!createdSection) continue

            // Create block position mapping
            const blocksByPosition = new Map()
            createdSection.blocks.forEach((block) => {
              blocksByPosition.set(block.position, block)
            })

            // Create routes
            for (let i = 0; i < sectionDto.blocks.length; i++) {
              const blockDto = sectionDto.blocks[i]
              const createdBlock = blocksByPosition.get(i)

              if (!createdBlock) continue

              // Create route to next if it exists
              if (blockDto.routeToNext) {
                const nextBlock = blocksByPosition.get(i + 1)
                if (nextBlock) {
                  await prisma.route.create({
                    data: {
                      sourceBlockId: createdBlock.id,
                      destinationBlockId: nextBlock.id,
                      distance: blockDto.routeToNext.distance,
                      duration: blockDto.routeToNext.duration,
                      polyline: blockDto.routeToNext.polyline,
                      transportMode:
                        blockDto.routeToNext.transportMode ||
                        TRANSPORT_MODE.DRIVE,
                    },
                  })
                }
              }
            }
          }
        }
      }

      if (updatedItinerary.isPublished) {
        this.meilisearchService.addOrUpdateItinerary(updatedItinerary)
      } else {
        // If unpublished, remove from search index
        this.meilisearchService.deleteItinerary(id)
      }

      return updatedItinerary
    })
  }

  async duplicateItinerary(id: string, user: User) {
    await this._checkReadItineraryPermission(id, user)

    // phase 1: duplicate the itinerary
    const originalItinerary = await this.prisma.itinerary.findUnique({
      where: { id: id },
      include: {
        sections: {
          where: {
            contingencyPlanId: null,
          },
          include: {
            blocks: {
              include: {
                routeToNext: true,
                routeFromPrevious: true,
              },
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
    const itineraryData: CreateItineraryDto = {
      title: originalItinerary.title + ' (Copy)',
      description: originalItinerary.description,
      coverImage: originalItinerary.coverImage,
      startDate: originalItinerary.startDate,
      endDate: originalItinerary.endDate,
      sections: originalItinerary.sections.map((section) =>
        this._mapSections(section)
      ),
      tags:
        originalItinerary.tags && originalItinerary.tags.length > 0
          ? originalItinerary.tags.map((tags) => tags.tag.id)
          : [],
    }
    const newItinerary = await this.createItinerary(itineraryData, user)
    return newItinerary
  }

  async duplicateContingency(
    newItineraryId: string,
    itineraryId: string,
    contingencyPlanId: string,
    user: User
  ) {
    // phase 2: duplicate contingency
    const contingecyPlan = await this.findContingencyPlan(
      itineraryId,
      contingencyPlanId,
      user
    )
    const contingencyData: CreateContingencyPlanDto = {
      title: contingecyPlan.title,
      description: contingecyPlan.description,
      sections: contingecyPlan.sections.map((section) =>
        this._mapSections(section)
      ),
    }
    const newContingencyPlan = await this.createContingencyPlan(
      newItineraryId,
      contingencyData,
      user
    )
    return newContingencyPlan
  }

  _mapSections(section: CreateSectionDto) {
    return {
      sectionNumber: section.sectionNumber,
      title: section.title ?? `Hari ke-${section.sectionNumber}`,
      blocks:
        section.blocks && section.blocks.length > 0
          ? section.blocks.map((block, index) => ({
              position: index,
              blockType: block.blockType,
              title: block.title,
              description: block.description,
              startTime: block.startTime ? new Date(block.startTime) : null,
              endTime: block.endTime ? new Date(block.endTime) : null,
              location: block.location,
              price: block.price ?? 0,
              photoUrl: block.photoUrl,
              routeToNext: block.routeToNext,
              routeFromPrevious: block.routeFromPrevious,
            }))
          : [],
    }
  }

  /**
   * Checks whether itinerary with given id exists
   * @param id Id for Itinerary
   * @param user User for permission check
   * @returns A simple Itinerary object
   */
  async _checkItineraryExists(id: string, user: User) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        access: {
          where: { userId: user.id },
        },
      },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`)
    }
    return itinerary
  }

  /**
   * Checks whether user has READ access to a given itinerary or not
   * @param id Id for Itinerary
   * @param user User for permission check
   * @returns A simple Itinerary object
   */
  async _checkReadItineraryPermission(id: string, user: User) {
    const itinerary = await this._checkItineraryExists(id, user)

    if (itinerary.userId !== user.id) {
      if (!itinerary.isPublished && itinerary.access.length === 0)
        throw new ForbiddenException(
          'You do not have permission to view this itinerary'
        )
    }
    return itinerary
  }

  /**
   * Checks whether user has UPDATE access to a given itinerary or not
   * @param id Id for Itinerary
   * @param user User for permission check
   * @returns A simple Itinerary object
   */
  async _checkUpdateItineraryPermission(id: string, user: User) {
    const itinerary = await this._checkItineraryExists(id, user)

    if (itinerary.userId !== user.id) {
      if (!itinerary.isPublished) {
        throw new ForbiddenException(
          'You do not have permission to update this itinerary'
        )
      }
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

  _generateBlockFromSections = (
    sections: CreateSectionDto[],
    options?: {
      itineraryId?: string
      contingencyPlanId?: string
    }
  ) => {
    return sections.map((section) => ({
      sectionNumber: section.sectionNumber,
      title: section.title || `Hari ke-${section.sectionNumber}`,
      ...(options?.itineraryId && {
        itinerary: {
          connect: { id: options.itineraryId },
        },
      }),
      ...(options?.contingencyPlanId && {
        contingencyPlan: {
          connect: { id: options.contingencyPlanId },
        },
      }),
      // Create blocks within each section
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
            where: {
              contingencyPlanId: null,
            },
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
                include: {
                  routeToNext: true,
                  routeFromPrevious: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          pendingInvites: true,
          access: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photoProfile: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.itinerary.count({ where: { userId, isCompleted: false } }),
    ])

    const formattedData = data.map((itinerary) => ({
      ...itinerary,
      invitedUsers: itinerary.access.map((access) => ({
        ...access.user,
      })),
      locationCount: itinerary.sections.reduce(
        (acc, section) => acc + section.blocks.length,
        0
      ),
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

  async findAllMyItineraries(
    userId: string,
    page: number,
    sharedBool: boolean,
    finishedBool: boolean
  ) {
    if (page < 1) throw new HttpException('Invalid page number', 400)

    const limit = PAGINATION_LIMIT
    const skip = (page - 1) * limit

    const whereClause = {
      ...(sharedBool
        ? { access: { some: { userId } } }
        : { OR: [{ userId }, { access: { some: { userId } } }] }),
      ...(finishedBool && { isCompleted: true }),
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.itinerary.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { startDate: 'asc' },
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          pendingInvites: true,
          access: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photoProfile: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.itinerary.count({ where: whereClause }),
    ])

    const formattedData = data.map((itinerary) => ({
      ...itinerary,
      invitedUsers: itinerary.access.map((access) => ({
        ...access.user,
      })),
      locationCount: itinerary.sections.reduce(
        (acc, section) => acc + section.blocks.length,
        0
      ),
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

  async findMySharedItineraries(userId: string, page: number) {
    if (page < 1) throw new HttpException('Invalid page number', 400)

    const limit = PAGINATION_LIMIT
    const skip = (page - 1) * limit

    const [data, total] = await this.prisma.$transaction([
      this.prisma.itinerary.findMany({
        where: { access: { some: { userId } } },
        take: limit,
        skip,
        orderBy: { startDate: 'asc' },
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          pendingInvites: true,
          access: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photoProfile: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.itinerary.count({ where: { access: { some: { userId } } } }),
    ])

    const formattedData = data.map((itinerary) => ({
      ...itinerary,
      invitedUsers: itinerary.access.map((access) => ({
        ...access.user,
      })),
      locationCount: itinerary.sections.reduce(
        (acc, section) => acc + section.blocks.length,
        0
      ),
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

  async findMyCompletedItineraries(userId: string, page: number) {
    if (page < 1) throw new HttpException('Invalid page number', 400)

    const limit = PAGINATION_LIMIT
    const skip = (page - 1) * limit

    const [data, total] = await this.prisma.$transaction([
      this.prisma.itinerary.findMany({
        where: { userId, isCompleted: true },
        take: limit,
        skip,
        orderBy: { startDate: 'asc' },
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
                include: {
                  routeToNext: true,
                  routeFromPrevious: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          pendingInvites: true,
          access: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  photoProfile: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.itinerary.count({ where: { userId, isCompleted: true } }),
    ])

    const formattedData = data.map((itinerary) => ({
      ...itinerary,
      invitedUsers: itinerary.access.map((access) => ({
        ...access.user,
      })),
      locationCount: itinerary.sections.reduce(
        (acc, section) => acc + section.blocks.length,
        0
      ),
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

  async findOne(id: string, user: User | null) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: id },
      include: {
        sections: {
          where: {
            contingencyPlanId: null,
          },
          include: {
            blocks: {
              include: {
                routeToNext: true,
                routeFromPrevious: true,
              },
            },
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoProfile: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        access: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photoProfile: true,
                email: true,
              },
            },
          },
        },
        pendingInvites: true,
      },
    })
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`)
    }
    if (itinerary.userId !== user?.id) {
      if (
        !itinerary.isPublished &&
        !itinerary.access.some((access) => access.userId === user?.id)
      )
        throw new ForbiddenException(
          'You do not have permission to view this itinerary'
        )
    }

    const result = {
      ...itinerary,
      invitedUsers: itinerary.access.map((access) => access.user),
    }
    delete result.access

    return result
  }

  async removeItinerary(id: string, user: User) {
    await this._checkUpdateItineraryPermission(id, user)
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
    })
    if (!itinerary) {
      throw new NotFoundException('Itinerary not found')
    }
    const result = await this.prisma.itinerary.delete({
      where: { id },
    })
    this.meilisearchService.deleteItinerary(id)
    return result
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

    await Promise.all(
      emails.map((email) =>
        this.emailService.sendEmail(
          email,
          'Invitation to join itinerary',
          invitationTemplate(email, this._generateInvitationLink(itineraryId))
        )
      )
    )

    return pendingItineraryInvites
  }

  _generateInvitationLink(itineraryId: string) {
    return `${process.env.CLIENT_URL}/itinerary/${itineraryId}/accept-invite`
  }

  async acceptItineraryInvitation(itineraryId: string, user: User) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        pendingInvites: {
          where: { email: user.email },
        },
        access: {
          where: { userId: user.id },
        },
      },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
    }

    const existingAccess = itinerary.access[0]

    if (existingAccess) {
      return itinerary.id
    }

    const pendingInvite = itinerary.pendingInvites[0]

    if (!pendingInvite) {
      throw new NotFoundException(`Invitation not found`)
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
          where: { id: pendingInvite.id },
        })

        return newItineraryAccess
      }
    )

    return newItineraryAccess.itineraryId
  }

  async removeUserFromItinerary(
    itineraryId: string,
    userTargetId: string,
    user: User
  ) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
    }

    if (itinerary.userId !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to remove users from this itinerary'
      )
    }

    const existingAccess = await this.prisma.itineraryAccess.findUnique({
      where: {
        itineraryId_userId: {
          itineraryId,
          userId: userTargetId,
        },
      },
    })

    if (!existingAccess) {
      throw new NotFoundException(
        `User with ID ${userTargetId} is not a participant of this itinerary`
      )
    }

    const deletedAccess = await this.prisma.itineraryAccess.delete({
      where: {
        itineraryId_userId: {
          itineraryId,
          userId: userTargetId,
        },
      },
    })

    return deletedAccess
  }

  async findContingencyPlans(itineraryId: string, user?: User) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        access: {
          where: { userId: user?.id },
        },
      },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
    }

    if (itinerary.userId !== user?.id) {
      if (!itinerary.isPublished && itinerary.access.length === 0)
        throw new ForbiddenException(
          'You do not have permission to view this itinerary'
        )
    }

    const contingencyPlans = await this.prisma.contingencyPlan.findMany({
      where: { itineraryId: itinerary.id },
      orderBy: {
        title: 'asc',
      },
    })
    return contingencyPlans
  }

  async findContingencyPlan(
    itineraryId: string,
    contingencyPlanId: string,
    user?: User
  ) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        access: {
          where: { userId: user?.id },
        },
      },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
    }
    if (itinerary.userId !== user?.id) {
      if (!itinerary.isPublished && itinerary.access.length === 0)
        throw new ForbiddenException(
          'You do not have permission to view this itinerary'
        )
    }

    const contingencyPlan = await this.prisma.contingencyPlan.findUnique({
      where: { id: contingencyPlanId },
      include: {
        sections: {
          include: {
            blocks: {
              include: {
                routeToNext: true,
                routeFromPrevious: true,
              },
            },
          },
          orderBy: {
            sectionNumber: 'asc',
          },
        },
      },
    })

    if (!contingencyPlan) {
      throw new NotFoundException(
        `Contingency plan with ID ${contingencyPlanId} not found`
      )
    }

    if (contingencyPlan.itineraryId !== itinerary.id) {
      throw new ForbiddenException(
        'You do not have permission to view or update this contingency plan'
      )
    }

    const mappedSections = contingencyPlan.sections.map((section) => ({
      ...section,
      sectionNumber: section.sectionNumber % 1000,
    }))

    return { ...contingencyPlan, sections: mappedSections }
  }

  async _checkContingencyCount(itineraryId: string) {
    const contingencyPlanCount = await this.prisma.contingencyPlan.count({
      where: { itineraryId },
    })

    if (contingencyPlanCount >= 2) {
      throw new BadRequestException(
        `You can only have up to 2 contingency plans`
      )
    }
    return contingencyPlanCount
  }

  async createContingencyPlan(
    itineraryId: string,
    data: CreateContingencyPlanDto,
    user: User
  ) {
    const itinerary = await this._checkUpdateItineraryPermission(
      itineraryId,
      user
    )
    const contingencyCount = await this._checkContingencyCount(itinerary.id)
    const CONTINGENCY_TITLE = ['B', 'C']
    return this.prisma.$transaction(async (prisma) => {
      const contingencyPlan = await prisma.contingencyPlan.create({
        data: {
          itineraryId: itinerary.id,
          title: `Plan ${CONTINGENCY_TITLE[contingencyCount]}`,
          description: data.description,
          sections: {
            create: data.sections.map((section) => ({
              sectionNumber:
                section.sectionNumber + (contingencyCount + 1) * 1000,
              title: section.title || `Hari ke-${section.sectionNumber}`,
              itinerary: {
                connect: { id: itinerary.id },
              },
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
              blocks: {
                include: {
                  routeToNext: true,
                  routeFromPrevious: true,
                },
              },
            },
          },
        },
      })

      if (data.sections && data.sections.length > 0) {
        for (const section of data.sections) {
          if (section.blocks && section.blocks.length > 0) {
            const createdBlocks =
              contingencyPlan.sections.find(
                (s) => s.sectionNumber % 1000 === section.sectionNumber
              )?.blocks || []

            // Create route mappings by position
            const blocksByPosition = new Map()
            createdBlocks.forEach((block) => {
              blocksByPosition.set(block.position, block)
            })

            // Process routes
            for (let i = 0; i < section.blocks.length; i++) {
              const block = section.blocks[i]
              const createdBlock = blocksByPosition.get(i)

              if (!createdBlock) continue

              // Create route to next if it exists
              if (block.routeToNext) {
                const nextBlock = blocksByPosition.get(i + 1)
                if (nextBlock) {
                  await prisma.route.create({
                    data: {
                      sourceBlockId: createdBlock.id,
                      destinationBlockId: nextBlock.id,
                      distance: block.routeToNext.distance,
                      duration: block.routeToNext.duration,
                      polyline: block.routeToNext.polyline,
                      transportMode:
                        block.routeToNext.transportMode || TRANSPORT_MODE.DRIVE,
                    },
                  })
                }
              }
            }
          }
        }
      }
      const mappedSections = contingencyPlan.sections.map((section) => ({
        ...section,
        sectionNumber: section.sectionNumber % 1000,
      }))

      return { ...contingencyPlan, sections: mappedSections }
    })
  }

  async selectContingencyPlan(
    itineraryId: string,
    contingencyPlanId: string,
    user: User
  ) {
    const itinerary = await this._checkUpdateItineraryPermission(
      itineraryId,
      user
    )
    const contingencyPlan = await this.prisma.contingencyPlan.findUnique({
      where: { id: contingencyPlanId },
    })
    if (!contingencyPlan) {
      throw new NotFoundException(
        `Contingency plan with ID ${contingencyPlanId} not found`
      )
    }
    if (contingencyPlan.itineraryId !== itinerary.id) {
      throw new ForbiddenException(
        'You do not have permission to view or update this contingency plan'
      )
    }
    const otherContingencyPlans = await this.findContingencyPlans(
      itineraryId,
      user
    )
    for (const plan of otherContingencyPlans) {
      await this.prisma.contingencyPlan.update({
        where: { id: plan.id },
        data: { isSelected: false },
      })
    }
    const updatedContingencyPlan = await this.prisma.contingencyPlan.update({
      where: { id: contingencyPlan.id },
      data: { isSelected: true },
      include: {
        sections: {
          include: {
            blocks: {
              include: {
                routeToNext: true,
                routeFromPrevious: true,
              },
            },
          },
        },
      },
    })

    const mappedSections = updatedContingencyPlan.sections.map((section) => ({
      ...section,
      sectionNumber: section.sectionNumber % 1000,
    }))

    return { ...updatedContingencyPlan, sections: mappedSections }
  }

  async updateContingencyPlan(
    itineraryId: string,
    contingencyPlanId: string,
    data: UpdateContingencyPlanDto,
    user: User
  ) {
    const itinerary = await this._checkUpdateItineraryPermission(
      itineraryId,
      user
    )
    const contingencyPlan = await this.prisma.contingencyPlan.findUnique({
      where: { id: contingencyPlanId },
    })
    if (!contingencyPlan) {
      throw new NotFoundException(
        `Contingency plan with ID ${contingencyPlanId} not found`
      )
    }
    if (contingencyPlan.itineraryId !== itinerary.id) {
      throw new ForbiddenException(
        'You do not have permission to update this contingency plan'
      )
    }
    this._validateItinerarySections(data)

    // Update itinerary with id
    return this.prisma.$transaction(async (prisma) => {
      const existingContingency = await this.prisma.contingencyPlan.findUnique({
        where: { id: contingencyPlanId, itineraryId: itinerary.id },
        include: {
          sections: {
            where: {
              contingencyPlanId: contingencyPlanId,
            },
            include: {
              blocks: {
                include: {
                  routeToNext: true,
                  routeFromPrevious: true,
                },
              },
            },
          },
        },
      })
      // Delete existing routes first
      for (const section of existingContingency.sections) {
        for (const block of section.blocks) {
          if (block.routeToNext) {
            await prisma.route.delete({
              where: { sourceBlockId: block.id },
            })
          }
        }
      }

      // Update the itinerary
      const updatedContingency = await prisma.contingencyPlan.update({
        where: { id: contingencyPlanId },
        data: {
          sections: {
            deleteMany: { contingencyPlanId },
            create: this._generateBlockFromSections(data.sections).map(
              (section) => ({
                ...section,
                sectionNumber:
                  section.sectionNumber +
                  Math.floor(
                    existingContingency.sections[0].sectionNumber / 1000
                  ) *
                    1000,
                itineraryId: itinerary.id,
              })
            ),
          },
        },
        include: {
          sections: {
            include: {
              blocks: {
                include: {
                  routeToNext: true,
                  routeFromPrevious: true,
                },
              },
            },
          },
        },
      })

      // Create new routes
      if (data.sections && data.sections.length > 0) {
        for (const sectionDto of data.sections) {
          if (sectionDto.blocks && sectionDto.blocks.length > 0) {
            const createdSection = updatedContingency.sections.find(
              (s) => s.sectionNumber % 1000 === sectionDto.sectionNumber
            )

            if (!createdSection) continue

            // Create block position mapping
            const blocksByPosition = new Map()
            createdSection.blocks.forEach((block) => {
              blocksByPosition.set(block.position, block)
            })

            // Create routes
            for (let i = 0; i < sectionDto.blocks.length; i++) {
              const blockDto = sectionDto.blocks[i]
              const createdBlock = blocksByPosition.get(i)

              if (!createdBlock) continue

              // Create route to next if it exists
              if (blockDto.routeToNext) {
                const nextBlock = blocksByPosition.get(i + 1)
                if (nextBlock) {
                  await prisma.route.create({
                    data: {
                      sourceBlockId: createdBlock.id,
                      destinationBlockId: nextBlock.id,
                      distance: blockDto.routeToNext.distance,
                      duration: blockDto.routeToNext.duration,
                      polyline: blockDto.routeToNext.polyline,
                      transportMode:
                        blockDto.routeToNext.transportMode ||
                        TRANSPORT_MODE.DRIVE,
                    },
                  })
                }
              }
            }
          }
        }
      }
      const mappedSections = updatedContingency.sections.map((section) => ({
        ...section,
        sectionNumber: section.sectionNumber % 1000,
      }))

      return { ...updatedContingency, sections: mappedSections }
    })
  }

  async searchItineraries(
    query: string = '',
    page: number = 1,
    limit: number = 20,
    filters?: any,
    sortBy: string = 'likes',
    order: 'asc' | 'desc' = 'desc'
  ) {
    const offset = (page - 1) * limit

    const searchOptions = {
      limit,
      offset,
      filter: filters,
      sort:
        sortBy === 'likes'
          ? [`likes:desc`]
          : [`likes:desc`, `${sortBy}:${order}`],
    }

    const result = await this.meilisearchService.searchItineraries(
      query,
      searchOptions
    )

    return {
      data: result.hits.map((hit) => ({
        id: hit.id,
        createdAt: hit.createdAt,
        title: hit.title,
        description: hit.description,
        coverImage: hit.coverImage,
        user: hit.user,
        tags: hit.tags,
        daysCount: hit.daysCount,
        likes: hit.likes,
      })),
      metadata: {
        total: result.estimatedTotalHits,
        page,
        totalPages: Math.ceil(result.estimatedTotalHits / limit) || 1,
      },
    }
  }

  async createViewItinerary(itineraryId: string, user: User) {
    const userId = user.id

    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
    })

    if (!itinerary) {
      throw new NotFoundException('Itinerary not found')
    }

    const itineraryAccess = await this.prisma.itineraryAccess.findMany({
      where: { itineraryId },
      select: { userId: true },
    })

    const hasAccess = itineraryAccess.some((access) => access.userId === userId)

    if (itinerary.userId != userId && !itinerary.isPublished && !hasAccess) {
      throw new UnauthorizedException('You have no access to this itinerary')
    }

    const userViews = await this.prisma.itineraryView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
    })

    const itineraryExists = userViews.some(
      (view) => view.itineraryId === itineraryId
    )

    if (itineraryExists) {
      return this.prisma.itineraryView.update({
        where: {
          userId_itineraryId: { userId, itineraryId },
        },
        data: {
          viewedAt: new Date(),
        },
      })
    }

    if (userViews.length >= 10) {
      await this.prisma.itineraryView.delete({
        where: {
          id: userViews[userViews.length - 1].id,
        },
      })
    }

    return this.prisma.itineraryView.create({
      data: {
        userId,
        itineraryId,
        viewedAt: new Date(),
      },
    })
  }

  async getViewItinerary(user: User) {
    const userId = user.id
    const views = await this.prisma.itineraryView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      include: {
        itinerary: {
          include: {
            user: {
              select: {
                firstName: true,
                photoProfile: true,
                id: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
            // Make sure to include tags if needed
            tags: {
              select: {
                tag: true,
              },
            },
          },
        },
      },
    })

    const formattedViews = views.map((view) => {
      const itinerary = view.itinerary
      const start = new Date(itinerary.startDate)
      const end = new Date(itinerary.endDate)

      return {
        id: itinerary.id,
        createdAt: itinerary.createdAt,
        title: itinerary.title,
        description: itinerary.description ?? null,
        coverImage: itinerary.coverImage || null,
        user: {
          id: itinerary.user.id,
          firstName: itinerary.user.firstName,
          photoProfile: itinerary.user.photoProfile ?? null,
        },
        tags: itinerary.tags ?? [],
        daysCount: Math.max(1, Math.ceil(end.getDate() - start.getDate() + 1)),
        likes: itinerary._count.likes ?? 0,
      }
    })

    return formattedViews
  }

  async publishItinerary(
    itineraryId: string,
    user: User,
    isPublished: boolean
  ) {
    await this._checkUpdateItineraryPermission(itineraryId, user)

    const updatedItinerary = await this.prisma.itinerary.update({
      where: { id: itineraryId },
      data: {
        isPublished,
      },
    })

    if (updatedItinerary.isPublished) {
      const completeItinerary = await this.prisma.itinerary.findUnique({
        where: { id: itineraryId },
        include: {
          sections: {
            where: {
              contingencyPlanId: null,
            },
            include: {
              blocks: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoProfile: true,
            },
          },
          likes: true,
        },
      })
      this.meilisearchService.addOrUpdateItinerary(completeItinerary)
    } else {
      this.meilisearchService.deleteItinerary(itineraryId)
    }

    return { updatedItinerary }
  }

  async saveItinerary(itineraryId: string, user: User) {
    const itinerary = await this._checkReadItineraryPermission(
      itineraryId,
      user
    )
    if (itinerary.userId === user.id) {
      throw new BadRequestException("Cannot save user's own itinerary")
    }

    const isItinerarySaved = await this._checkUserSavedItinerary(
      itineraryId,
      user
    )
    if (isItinerarySaved) {
      throw new BadRequestException('Itinerary already saved by user')
    }

    const itineraryLike = await this.prisma.itineraryLike.create({
      data: {
        itineraryId: itineraryId,
        userId: user.id,
      },
    })

    this._updateLikeCount(itineraryId)
    return itineraryLike
  }

  async unsaveItinerary(itineraryId: string, user: User) {
    const itinerary = await this._checkItineraryExists(itineraryId, user)
    if (itinerary.userId === user.id) {
      throw new BadRequestException("Cannot unsave user's own itinerary")
    }

    const isItinerarySaved = await this._checkUserSavedItinerary(
      itineraryId,
      user
    )
    if (!isItinerarySaved) {
      throw new BadRequestException('Itinerary is not saved by user')
    }

    const itineraryLike = await this.prisma.itineraryLike.delete({
      where: { itineraryId_userId: { itineraryId, userId: user.id } },
    })

    this._updateLikeCount(itineraryId)
    return itineraryLike
  }

  async _updateLikeCount(itineraryId: string) {
    const updatedItinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
      include: {
        likes: true,
        sections: {
          where: {
            contingencyPlanId: null,
          },
          include: {
            blocks: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoProfile: true,
          },
        },
      },
    })

    if (updatedItinerary.isPublished) {
      this.meilisearchService.addOrUpdateItinerary(updatedItinerary)
    }
  }

  async batchCheckUserSavedItinerary(itineraryIds: string[], user: User) {
    let result: { [key: string]: boolean } = {}
    const itineraryLikes = await this.prisma.itineraryLike.findMany({
      where: { itineraryId: { in: itineraryIds }, userId: user.id },
    })
    const likedItineraryIds = itineraryLikes.map((like) => like.itineraryId)
    for (const itineraryId of itineraryIds) {
      result[itineraryId] = likedItineraryIds.includes(itineraryId)
    }
    return result
  }

  async _checkUserSavedItinerary(itineraryId: string, user: User) {
    const itineraryLike = await this.prisma.itineraryLike.findUnique({
      where: { itineraryId_userId: { itineraryId, userId: user.id } },
    })

    return itineraryLike !== null
  }

  async findItinerariesByLatestTags(user: User) {
    const latestItineraries = await this.prisma.itinerary.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 3,
    })

    const recentViewedItineraries = await this.prisma.itineraryView.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { viewedAt: 'desc' },
      select: {
        itinerary: true,
      },
      take: 3,
    })

    const combinedItineraries = recentViewedItineraries
      .map((view) => view.itinerary)
      .concat(latestItineraries)

    if (combinedItineraries.length === 0) {
      return []
    }

    const latestTags = await this.prisma.itineraryTag.findMany({
      where: {
        itineraryId: {
          in: combinedItineraries.map((itinerary) => itinerary.id),
        },
      },
      select: {
        tag: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!latestTags || latestTags.length === 0) return []

    const mappedTags = latestTags.map((tag) => `"${tag.tag.id.toString()}"`)

    const searchResult = await this.meilisearchService.searchItineraries('', {
      limit: 8,
      filter: `tags.tag.id IN [${mappedTags.toString()}]`,
    })

    return searchResult.hits
  }
}
