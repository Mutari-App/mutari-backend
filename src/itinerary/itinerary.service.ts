import {
  HttpException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

@Injectable()
export class ItineraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
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

      return itinerary
    })
  }

  async updateItinerary(id: string, data: UpdateItineraryDto, user: User) {
    await this._checkItineraryExists(id, user)
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
      return updatedItinerary
    })
  }

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

    if (itinerary.userId !== user.id && itinerary.access.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to update or view this itinerary'
      )
    }

    return itinerary
  }

  async _checkUpdateItineraryPermission(id: string, user: User) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
    })

    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`)
    }

    if (itinerary.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this itinerary'
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

  async findOne(id: string, user: User) {
    await this._checkItineraryExists(id, user)
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
      },
    })
    return itinerary
  }

  async removeItinerary(id: string, user: User) {
    await this._checkUpdateItineraryPermission(id, user)
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

  async findContingencyPlans(itineraryId: string, user: User) {
    const itinerary = await this._checkUpdateItineraryPermission(
      itineraryId,
      user
    )
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
    user: User
  ) {
    const itinerary = await this._checkUpdateItineraryPermission(
      itineraryId,
      user
    )

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
    const itinerary = await this._checkItineraryExists(itineraryId, user)
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

  async createViewItinerary(itineraryId: string, user: User) {
    const userId = user.id

    return this.prisma.itineraryView.upsert({
      where: {
        userId_itineraryId: { userId, itineraryId },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        itineraryId,
        viewedAt: new Date(),
      },
    })
  }

  async getViewItinerary(user: User) {
    const userId = user.id

    return this.prisma.itineraryView.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        viewedAt: 'desc',
      },
    })
  }
}
