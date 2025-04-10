import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { BLOCK_TYPE, Tag, TRANSPORT_MODE, User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { EmailService } from 'src/email/email.service'
import { CreateContingencyPlanDto } from './dto/create-contingency-plan.dto'
import { UpdateContingencyPlanDto } from './dto/update-contingency-plan.dto'

describe('ItineraryService', () => {
  let service: ItineraryService
  let prismaService: PrismaService

  const mockPrismaService = {
    $transaction: jest
      .fn()
      .mockImplementation((callback) => callback(mockPrismaService)),
    itinerary: {
      create: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
    itineraryAccess: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    pendingItineraryInvite: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    contingencyPlan: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    route: {
      create: jest.fn(),
    },
    _checkItineraryExists: jest.fn(),
    _checkContingencyCount: jest.fn(),
  }

  const mockUser: User = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: new Date(),
    email: 'john@example.com',
    phoneNumber: '123456789',
    password: 'hashedpassword',
    photoProfile: null,
    referralCode: null,
    isEmailConfirmed: false,
    referredById: null,
    loyaltyPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockItineraryData = {
    id: '1',
    userId: 'user1',
    title: 'Itinerary Mock',
    description: 'This is a mocked itinerary',
    coverImage: 'image.jpg',
    startDate: new Date(),
    endDate: new Date(),
    isPublished: false,
    isCompleted: false,
    sections: [],
    locationCount: 0,
    pendingInvites: [],
    access: [],
    invitedUsers: [],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(), // Mock any methods used in the service
          },
        },
      ],
    }).compile()

    service = module.get<ItineraryService>(ItineraryService)
    prismaService = module.get<PrismaService>(PrismaService)

    mockPrismaService.$transaction.mockReset()
    mockPrismaService.$transaction.mockImplementation((arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrismaService)
      } else if (Array.isArray(arg)) {
        return Promise.all(arg)
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createItinerary', () => {
    it('should create an itinerary with sections and blocks', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        coverImage: 'beach.jpg',
        tags: ['tag-123', 'tag-456'],
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [
              {
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Beach Resort',
                description: 'Check in at the beach resort',
                position: 0,
                startTime: new Date('2025-03-10T14:00:00Z'),
                endTime: new Date('2025-03-10T15:00:00Z'),
                location: 'Beach Resort',
                price: 500000,
                photoUrl: 'resort.jpg',
              },
              {
                blockType: BLOCK_TYPE.NOTE,
                description:
                  'Dont forget to make dinner reservation at seafood restaurant',
                position: 1,
              },
            ],
          },
          {
            sectionNumber: 2,
            title: 'Day 2',
            blocks: [
              {
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Snorkeling Trip',
                description: 'Group snorkeling trip',
                position: 0,
                startTime: new Date('2025-03-11T09:00:00Z'),
                endTime: new Date('2025-03-11T12:00:00Z'),
                location: 'Coral Reef',
                price: 250000,
                photoUrl: 'snorkeling.jpg',
              },
            ],
          },
        ],
      }

      const expectedItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: createItineraryDto.title,
        description: createItineraryDto.description,
        coverImage: createItineraryDto.coverImage,
        startDate: new Date(createItineraryDto.startDate),
        endDate: new Date(createItineraryDto.endDate),
        isPublished: false,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: [
          {
            id: 'section-1',
            itineraryId: 'itinerary-123',
            sectionNumber: 1,
            title: 'Day 1',
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [
              {
                id: 'block-1',
                sectionId: 'section-1',
                position: 0,
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Beach Resort',
                description: 'Check in at the beach resort',
                startTime: new Date('2025-03-10T14:00:00Z'),
                endTime: new Date('2025-03-10T15:00:00Z'),
                location: 'Beach Resort',
                price: 500000,
                photoUrl: 'resort.jpg',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'block-2',
                sectionId: 'section-1',
                position: 1,
                blockType: BLOCK_TYPE.NOTE,
                description:
                  'Dont forget to make dinner reservation at seafood restaurant',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
          {
            id: 'section-2',
            itineraryId: 'itinerary-123',
            sectionNumber: 2,
            title: 'Day 2',
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [
              {
                id: 'block-3',
                sectionId: 'section-2',
                position: 0,
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Snorkeling Trip',
                description: 'Group snorkeling trip',
                startTime: new Date('2025-03-11T09:00:00Z'),
                endTime: new Date('2025-03-11T12:00:00Z'),
                location: 'Coral Reef',
                price: 250000,
                photoUrl: 'snorkeling.jpg',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
        tags: [
          {
            id: 'itinerarytag-1',
            itineraryId: 'itinerary-123',
            tagId: 'tag-123',
            createdAt: new Date(),
            tag: {
              id: 'tag-123',
              name: 'Beach',
              description: 'Beach activities',
              iconUrl: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          {
            id: 'itinerarytag-2',
            itineraryId: 'itinerary-123',
            tagId: 'tag-456',
            createdAt: new Date(),
            tag: {
              id: 'tag-456',
              name: 'Vacation',
              description: 'Vacation activities',
              iconUrl: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
      }

      // Mock tag validation
      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: 'tag-123', name: 'Beach' },
        { id: 'tag-456', name: 'Vacation' },
      ])

      mockPrismaService.itinerary.create.mockResolvedValue(expectedItinerary)

      // Act
      const result = await service.createItinerary(createItineraryDto, mockUser)

      // Assert
      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['tag-123', 'tag-456'],
          },
        },
      })
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          title: createItineraryDto.title,
          description: createItineraryDto.description,
          coverImage: createItineraryDto.coverImage,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          tags: {
            create: [
              { tag: { connect: { id: 'tag-123' } } },
              { tag: { connect: { id: 'tag-456' } } },
            ],
          },
          sections: {
            create: [
              {
                sectionNumber: 1,
                title: 'Day 1',
                blocks: {
                  create: [
                    {
                      position: 0,
                      blockType: BLOCK_TYPE.LOCATION,
                      title: 'Beach Resort',
                      description: 'Check in at the beach resort',
                      startTime: expect.any(Date),
                      endTime: expect.any(Date),
                      location: 'Beach Resort',
                      price: 500000,
                      photoUrl: 'resort.jpg',
                    },
                    {
                      position: 1,
                      blockType: BLOCK_TYPE.NOTE,
                      description:
                        'Dont forget to make dinner reservation at seafood restaurant',
                      startTime: null,
                      endTime: null,
                      location: undefined,
                      price: 0,
                      photoUrl: undefined,
                    },
                  ],
                },
              },
              {
                sectionNumber: 2,
                title: 'Day 2',
                blocks: {
                  create: [
                    {
                      position: 0,
                      blockType: BLOCK_TYPE.LOCATION,
                      title: 'Snorkeling Trip',
                      description: 'Group snorkeling trip',
                      startTime: expect.any(Date),
                      endTime: expect.any(Date),
                      location: 'Coral Reef',
                      price: 250000,
                      photoUrl: 'snorkeling.jpg',
                    },
                  ],
                },
              },
            ],
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
      expect(result).toEqual(expectedItinerary)
    })

    it('should create an itinerary with default section title, empty blocks, and empty tags', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Default Section Title Trip',
        description: 'A trip with default section titles and empty blocks',
        startDate: new Date('2025-05-10'),
        endDate: new Date('2025-05-15'),
        sections: [
          {
            sectionNumber: 1,
            title: '', // Empty title to trigger default title
            blocks: [], // Empty blocks
          },
        ],
      }

      const expectedItinerary = {
        id: 'itinerary-456',
        userId: mockUser.id,
        title: createItineraryDto.title,
        description: createItineraryDto.description,
        coverImage: createItineraryDto.coverImage,
        startDate: new Date(createItineraryDto.startDate),
        endDate: new Date(createItineraryDto.endDate),
        isPublished: false,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: [
          {
            id: 'section-4',
            itineraryId: 'itinerary-456',
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [], // Empty blocks
          },
        ],
        tags: [],
      }

      mockPrismaService.itinerary.create.mockResolvedValue(expectedItinerary)

      // Act
      const result = await service.createItinerary(createItineraryDto, mockUser)

      // Assert
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          title: createItineraryDto.title,
          description: createItineraryDto.description,
          coverImage: createItineraryDto.coverImage,
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          tags: undefined,
          sections: {
            create: [
              {
                sectionNumber: 1,
                title: 'Hari ke-1', // Default title
                blocks: {
                  create: [], // Empty blocks
                },
              },
            ],
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
      expect(result).toEqual(expectedItinerary)
    })

    it('should throw BadRequestException when date format is invalid', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Invalid Date Format Trip',
        description: 'A trip with invalid date format',
        startDate: 'invalid-date' as any, // Invalid date format
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
        ],
      }

      // Act & Assert
      await expect(
        service.createItinerary(createItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when start date is after end date', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Invalid Date Trip',
        description: 'A trip with invalid dates',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-03-10'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
        ],
      }

      // Act & Assert
      await expect(
        service.createItinerary(createItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when no sections are provided', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'No Sections Trip',
        description: 'A trip without sections',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [],
      }

      // Act & Assert
      await expect(
        service.createItinerary(createItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when duplicate section numbers are provided', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Duplicate Section Numbers Trip',
        description: 'A trip with duplicate section numbers',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
          {
            sectionNumber: 1, // Duplicate section number
            title: 'Another Day 1',
            blocks: [],
          },
        ],
      }

      // Act & Assert
      await expect(
        service.createItinerary(createItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when tags do not exist', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Invalid Tags Trip',
        description: 'A trip with invalid tags',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        tags: ['tag-123', 'tag-789'],
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
        ],
      }

      // Mock tag validation - only one tag exists
      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: 'tag-123', name: 'Beach' },
      ])

      // Act & Assert
      await expect(
        service.createItinerary(createItineraryDto, mockUser)
      ).rejects.toThrow(NotFoundException)
      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['tag-123', 'tag-789'],
          },
        },
      })
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('updateItinerary', () => {
    it('should update an itinerary with new details, tags, sections, and blocks', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Updated Beach Trip',
        description: 'An updated relaxing beach vacation',
        startDate: new Date('2025-03-11'),
        endDate: new Date('2025-03-16'),
        coverImage: 'beach2.jpg',
        tags: ['tag-123'],
        sections: [
          {
            sectionNumber: 1,
            title: 'Updated Day 1',
            blocks: [
              {
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Updated Beach Resort',
                description: 'Check in at the updated beach resort',
                position: 0,
                startTime: new Date('2025-03-11T14:00:00Z'),
                endTime: new Date('2025-03-11T15:00:00Z'),
                location: 'Updated Beach Resort',
                price: 600000,
                photoUrl: 'updated_resort.jpg',
              },
            ],
          },
        ],
      }

      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      const updatedItinerary = {
        id: 'itinerary-123',
        title: updateItineraryDto.title,
        description: updateItineraryDto.description,
        startDate: new Date(updateItineraryDto.startDate),
        endDate: new Date(updateItineraryDto.endDate),
        isPublished: false,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: [
          {
            id: 'section-1',
            itineraryId: 'itinerary-123',
            sectionNumber: 1,
            title: 'Updated Day 1',
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [
              {
                id: 'block-1',
                sectionId: 'section-1',
                position: 0,
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Updated Beach Resort',
                description: 'Check in at the updated beach resort',
                startTime: new Date('2025-03-11T14:00:00Z'),
                endTime: new Date('2025-03-11T15:00:00Z'),
                location: 'Updated Beach Resort',
                price: 600000,
                photoUrl: 'updated_resort.jpg',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
        tags: [
          {
            id: 'itinerarytag-1',
            itineraryId: 'itinerary-123',
            tagId: 'tag-123',
            createdAt: new Date(),
            tag: {
              id: 'tag-123',
              name: 'Beach',
              description: 'Beach activities',
              iconUrl: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )
      // Mock tag validation
      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: 'tag-123', name: 'Beach' },
      ])
      mockPrismaService.itinerary.update.mockResolvedValue(updatedItinerary)

      // Act
      const result = await service.updateItinerary(
        'itinerary-123',
        updateItineraryDto,
        mockUser
      )

      // Assert
      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['tag-123'],
          },
        },
      })
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.update).toHaveBeenCalledWith({
        where: { id: 'itinerary-123', userId: mockUser.id },
        data: {
          title: updateItineraryDto.title,
          description: updateItineraryDto.description,
          coverImage: updateItineraryDto.coverImage,
          startDate: updateItineraryDto.startDate,
          endDate: updateItineraryDto.endDate,
          tags: {
            deleteMany: { itineraryId: 'itinerary-123' },
            create: [{ tag: { connect: { id: 'tag-123' } } }],
          },
          sections: {
            deleteMany: {
              itineraryId: 'itinerary-123',
              contingencyPlanId: null,
            },
            create: [
              {
                sectionNumber: 1,
                title: 'Updated Day 1',
                blocks: {
                  create: [
                    {
                      position: 0,
                      blockType: BLOCK_TYPE.LOCATION,
                      title: 'Updated Beach Resort',
                      description: 'Check in at the updated beach resort',
                      startTime: new Date('2025-03-11T14:00:00Z'),
                      endTime: new Date('2025-03-11T15:00:00Z'),
                      location: 'Updated Beach Resort',
                      price: 600000,
                      photoUrl: 'updated_resort.jpg',
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          sections: {
            include: {
              blocks: {
                include: {
                  routeFromPrevious: true,
                  routeToNext: true,
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
      expect(result).toEqual(updatedItinerary)
    })

    it('should update an itinerary with defaults for deleted/missing fields', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Default Section Title Trip',
        description: 'A trip with default section titles and empty blocks',
        startDate: new Date('2025-05-10'),
        endDate: new Date('2025-05-15'),
        sections: [
          {
            sectionNumber: 1,
            title: '', // Empty title to trigger default title
            blocks: [], // Empty blocks
          },
        ],
      }

      const existingItinerary = {
        title: 'Updated Beach Trip',
        userId: mockUser.id,
        description: 'An updated relaxing beach vacation',
        startDate: new Date('2025-03-11'),
        endDate: new Date('2025-03-16'),
        coverImage: 'beach2.jpg',
        tags: ['tag-123'],
        sections: [
          {
            sectionNumber: 1,
            title: 'Updated Day 1',
            blocks: [
              {
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Updated Beach Resort',
                description: 'Check in at the updated beach resort',
                position: 0,
                startTime: new Date('2025-03-11T14:00:00Z'),
                endTime: new Date('2025-03-11T15:00:00Z'),
                location: 'Updated Beach Resort',
                price: 600000,
                photoUrl: 'updated_resort.jpg',
              },
            ],
          },
        ],
      }

      const updatedItinerary = {
        id: 'itinerary-123',
        title: updateItineraryDto.title,
        description: updateItineraryDto.description,
        startDate: updateItineraryDto.startDate,
        endDate: updateItineraryDto.endDate,
        isPublished: false,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: [
          {
            id: 'section-1',
            itineraryId: 'itinerary-123',
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [], // Empty blocks
          },
        ],
        tags: [],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )
      mockPrismaService.itinerary.update.mockResolvedValue(updatedItinerary)

      // Act
      const result = await service.updateItinerary(
        'itinerary-123',
        updateItineraryDto,
        mockUser
      )

      // Assert=
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.update).toHaveBeenCalledWith({
        where: { id: 'itinerary-123', userId: mockUser.id },
        data: {
          title: updateItineraryDto.title,
          description: updateItineraryDto.description,
          coverImage: updateItineraryDto.coverImage,
          startDate: new Date('2025-05-10'),
          endDate: new Date('2025-05-15'),
          tags: {
            deleteMany: { itineraryId: 'itinerary-123' },
            create: undefined,
          },
          sections: {
            deleteMany: {
              itineraryId: 'itinerary-123',
              contingencyPlanId: null,
            },
            create: [
              {
                sectionNumber: 1,
                title: 'Hari ke-1', // Default title
                blocks: {
                  create: [], // Empty blocks
                },
              },
            ],
          },
        },
        include: {
          sections: {
            include: {
              blocks: {
                include: {
                  routeFromPrevious: true,
                  routeToNext: true,
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
      expect(result).toEqual(updatedItinerary)
    })

    it('should update an itinerary with defaults for missing block fields', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Default New Block Trip',
        description: 'A trip updated with default new block',
        startDate: new Date('2025-05-10'),
        endDate: new Date('2025-05-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1',
            blocks: [
              {
                blockType: BLOCK_TYPE.LOCATION,
                position: 0,
              },
            ],
          },
        ],
      }

      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      const updatedItinerary = {
        id: 'itinerary-123',
        title: updateItineraryDto.title,
        description: updateItineraryDto.description,
        startDate: updateItineraryDto.endDate,
        endDate: updateItineraryDto.endDate,
        isPublished: false,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: [
          {
            id: 'section-1',
            itineraryId: 'itinerary-123',
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [
              {
                id: 'block-1',
                sectionId: 'section-1',
                position: 0,
                blockType: BLOCK_TYPE.LOCATION,
                title: '',
                description: '',
                startTime: null,
                endTime: null,
                location: '',
                price: 0,
                photoUrl: '',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
        tags: [],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )
      mockPrismaService.itinerary.update.mockResolvedValue(updatedItinerary)

      // Act
      const result = await service.updateItinerary(
        'itinerary-123',
        updateItineraryDto,
        mockUser
      )

      // Assert=
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.update).toHaveBeenCalledWith({
        where: { id: 'itinerary-123', userId: mockUser.id },
        data: {
          title: updateItineraryDto.title,
          description: updateItineraryDto.description,
          coverImage: updateItineraryDto.coverImage,
          startDate: new Date('2025-05-10'),
          endDate: new Date('2025-05-15'),
          tags: {
            deleteMany: { itineraryId: 'itinerary-123' },
            create: undefined,
          },
          sections: {
            deleteMany: {
              itineraryId: 'itinerary-123',
              contingencyPlanId: null,
            },
            create: [
              {
                sectionNumber: 1,
                title: 'Hari ke-1', // Default title
                blocks: {
                  create: [
                    {
                      position: 0,
                      blockType: BLOCK_TYPE.LOCATION,
                      title: undefined,
                      description: undefined,
                      startTime: null,
                      endTime: null,
                      location: undefined,
                      price: 0,
                      photoUrl: undefined,
                    },
                  ],
                },
              },
            ],
          },
        },
        include: {
          sections: {
            include: {
              blocks: {
                include: {
                  routeFromPrevious: true,
                  routeToNext: true,
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
      expect(result).toEqual(updatedItinerary)
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Non-existent Itinerary',
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.updateItinerary('non-existent-id', updateItineraryDto, mockUser)
      ).rejects.toThrow(NotFoundException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if user does not own the itinerary', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: "Another User's Itinerary",
      }

      const existingItinerary = {
        id: 'itinerary-123',
        userId: 'another-user-id',
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
        pendingInvites: [],
        access: [],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )

      // Act & Assert
      await expect(
        service.updateItinerary('itinerary-123', updateItineraryDto, mockUser)
      ).rejects.toThrow(ForbiddenException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when date format is invalid', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Invalid Date Format Trip Update',
        description: 'A trip with invalid date format on update',
        startDate: 'invalid-date' as any, // Invalid date format
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
        ],
      }
      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )

      // Act & Assert
      await expect(
        service.updateItinerary('itinerary-123', updateItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when start date is after end date', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Invalid Date Format Trip Update',
        description: 'A trip with invalid date format on update',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-03-10'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
        ],
      }
      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )

      // Act & Assert
      await expect(
        service.updateItinerary('itinerary-123', updateItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when block start time is after end time', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Invalid Date Format Trip Update',
        description: 'A trip with invalid date format on update',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [
              {
                blockType: BLOCK_TYPE.LOCATION,
                position: 0,
                startTime: new Date('2025-03-11T16:00:00Z'),
                endTime: new Date('2025-03-11T15:00:00Z'),
              },
            ],
          },
        ],
      }
      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )

      // Act & Assert
      await expect(
        service.updateItinerary('itinerary-123', updateItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when no sections are provided', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'No Sections Trip',
        description: 'A trip without sections',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [],
      }
      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )

      // Act & Assert
      await expect(
        service.updateItinerary('itinerary-123', updateItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when duplicate section numbers are provided', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Duplicate Section Numbers Trip',
        description: 'A trip with duplicate section numbers',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
          {
            sectionNumber: 1, // Duplicate section number
            title: 'Another Day 1',
            blocks: [],
          },
        ],
      }
      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )

      // Act & Assert
      await expect(
        service.updateItinerary('itinerary-123', updateItineraryDto, mockUser)
      ).rejects.toThrow(BadRequestException)
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when tags do not exist', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Invalid Tags Trip',
        description: 'A trip with invalid tags',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        tags: ['tag-123', 'tag-789'],
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
        ],
      }
      const existingItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'Beach Trip',
        description: 'A relaxing beach vacation',
        startDate: new Date('2025-03-10'),
        endDate: new Date('2025-03-15'),
        sections: [
          {
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            blocks: [], // Empty blocks
          },
        ],
      }

      // Mock tag validation - only one tag exists
      mockPrismaService.tag.findMany.mockResolvedValue([
        { id: 'tag-123', name: 'Beach' },
      ])

      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        existingItinerary
      )

      // Act & Assert
      await expect(
        service.updateItinerary('itinerary-123', updateItineraryDto, mockUser)
      ).rejects.toThrow(NotFoundException)
      expect(mockPrismaService.tag.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['tag-123', 'tag-789'],
          },
        },
      })
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('_checkUpdateItineraryPermission', () => {
    it('should throw NotFoundException when itinerary does not exist', async () => {
      // Arrange
      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service._checkUpdateItineraryPermission('non-existent-id', mockUser)
      ).rejects.toThrow(NotFoundException)

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      })
    })

    it('should throw ForbiddenException when user is not the owner', async () => {
      // Arrange
      const mockItinerary = {
        id: 'itinerary-123',
        userId: 'different-user-id',
        title: "Someone else's itinerary",
      }
      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)

      // Act & Assert
      await expect(
        service._checkUpdateItineraryPermission('itinerary-123', mockUser)
      ).rejects.toThrow(ForbiddenException)

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: 'itinerary-123' },
      })
    })

    it('should return the itinerary if user is the owner', async () => {
      // Arrange
      const mockItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: 'My itinerary',
      }
      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)

      // Act
      const result = await service._checkUpdateItineraryPermission(
        'itinerary-123',
        mockUser
      )

      // Assert
      expect(result).toEqual(mockItinerary)
      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: 'itinerary-123' },
      })
    })
  })

  describe('findOneItinerary', () => {
    it('should return itinerary when found and user has access to it', async () => {
      const mockItinerary = {
        id: '123',
        userId: 'user-123',
        sections: [
          {
            id: '1',
            blocks: [{ id: 'block1' }, { id: 'block2' }],
          },
        ],
      }
      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)
      const result = await service.findOne('123', mockUser)

      expect(result).toEqual(mockItinerary)
      expect(prismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
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
    })

    it('should allow user to see itinerary if invited', async () => {
      const mockItinerary = {
        id: '123',
        userId: 'different-user-123',
        access: [{ userId: mockUser.id }],
        sections: [
          {
            id: '1',
            blocks: [{ id: 'block1' }, { id: 'block2' }],
          },
        ],
      }
      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)
      const result = await service.findOne('123', mockUser)

      expect(result).toEqual(mockItinerary)
      expect(prismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
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
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      const itineraryId = 'non-existent-id'

      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      await expect(service.findOne(itineraryId, mockUser)).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if user is not authorized', async () => {
      const mockItinerary = { id: '1', userId: '999', access: [] }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)

      await expect(service.findOne('1', mockUser)).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('findMyItineraries', () => {
    it('should return paginated itineraries', async () => {
      const mockData = [
        {
          ...mockItineraryData,
          access: [
            {
              user: {
                id: 'invited-user',
                firstName: 'Jane',
                lastName: 'Doe',
                photoProfile: 'link.png',
                email: 'janedoe@example.com',
              },
            },
          ],
        },
      ]
      const mockResult = [
        {
          ...mockItineraryData,
          access: [
            {
              user: {
                id: 'invited-user',
                firstName: 'Jane',
                lastName: 'Doe',
                photoProfile: 'link.png',
                email: 'janedoe@example.com',
              },
            },
          ],
          invitedUsers: [
            {
              id: 'invited-user',
              firstName: 'Jane',
              lastName: 'Doe',
              photoProfile: 'link.png',
              email: 'janedoe@example.com',
            },
          ],
        },
      ]
      const mockTotal = 10
      const mockPage = 1
      const mockLimit = PAGINATION_LIMIT

      mockPrismaService.$transaction.mockImplementation(async (queries) => {
        return Promise.all(queries)
      })
      mockPrismaService.itinerary.findMany.mockResolvedValue(mockData)
      mockPrismaService.itinerary.count.mockResolvedValue(mockTotal)

      const result = await service.findMyItineraries('user1', mockPage)

      expect(result).toEqual({
        data: mockResult,
        metadata: {
          total: mockTotal,
          page: mockPage,
          totalPages: Math.ceil(mockTotal / mockLimit),
        },
      })
    })

    it('should handle negative page numbers', async () => {
      try {
        await service.findMyItineraries('123', -1)
      } catch (error) {
        expect(error.message).toBe('Invalid page number')
      }
    })

    it('should handle overflow page numbers', async () => {
      const mockTotal = 3
      const fixedLimit = PAGINATION_LIMIT
      const totalPages = Math.ceil(mockTotal / fixedLimit)

      mockPrismaService.$transaction.mockImplementation(async (queries) => {
        return Promise.all(queries)
      })
      mockPrismaService.itinerary.findMany.mockResolvedValue([])
      mockPrismaService.itinerary.count.mockResolvedValue(0)

      try {
        await service.findMyItineraries('123', totalPages + 1)
      } catch (error) {
        expect(error.message).toBe('Page number exceeds total available pages')
      }
    })

    it('should return empty list if user has no itineraries', async () => {
      mockPrismaService.$transaction.mockImplementation(async (queries) => {
        return Promise.all(queries)
      })
      mockPrismaService.itinerary.findMany.mockResolvedValue([])
      mockPrismaService.itinerary.count.mockResolvedValue(0)

      const result = await service.findMyItineraries('123', 1)

      expect(result).toEqual({
        data: [],
        metadata: {
          total: 0,
          page: 1,
          totalPages: 1,
        },
      })
    })
  })

  describe('findAllMyItineraries', () => {
    it('should return paginated itineraries for both owned and shared when sharedBool is false', async () => {
      const userId = 'user-123'
      const page = 1
      const sharedBool = false
      const finishedBool = false

      const mockData = [
        {
          ...mockItineraryData,
          userId,
          access: [],
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
        },
        {
          ...mockItineraryData,
          id: '2',
          userId: 'other-user',
          access: [
            {
              userId,
              user: {
                id: userId,
                firstName: 'John',
                lastName: 'Doe',
                photoProfile: null,
                email: 'john@example.com',
              },
            },
          ],
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
        },
      ]
      const mockTotal = 2

      mockPrismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await service.findAllMyItineraries(
        userId,
        page,
        sharedBool,
        finishedBool
      )

      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId }, { access: { some: { userId } } }],
        },
        take: PAGINATION_LIMIT,
        skip: 0,
        orderBy: { startDate: 'asc' },
        include: expect.any(Object),
      })

      expect(result).toEqual({
        data: expect.any(Array),
        metadata: {
          total: mockTotal,
          page,
          totalPages: Math.ceil(mockTotal / PAGINATION_LIMIT),
        },
      })

      // Verify data was properly formatted
      expect(result.data[0].locationCount).toBe(1)
      expect(result.data[1].locationCount).toBe(1)
      expect(result.data[1].invitedUsers).toEqual([
        {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          photoProfile: null,
          email: 'john@example.com',
        },
      ])
    })

    it('should return only shared itineraries when sharedBool is true', async () => {
      const userId = 'user-123'
      const page = 1
      const sharedBool = true
      const finishedBool = false

      const mockData = [
        {
          ...mockItineraryData,
          id: '2',
          userId: 'other-user',
          access: [
            {
              userId,
              user: {
                id: userId,
                firstName: 'John',
                lastName: 'Doe',
                photoProfile: null,
                email: 'john@example.com',
              },
            },
          ],
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
        },
      ]
      const mockTotal = 1

      mockPrismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await service.findAllMyItineraries(
        userId,
        page,
        sharedBool,
        finishedBool
      )

      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: {
          access: { some: { userId } },
        },
        take: PAGINATION_LIMIT,
        skip: 0,
        orderBy: { startDate: 'asc' },
        include: expect.any(Object),
      })

      expect(result.data.length).toBe(1)
      expect(result.metadata.total).toBe(1)
    })

    it('should return only completed itineraries when finishedBool is true', async () => {
      const userId = 'user-123'
      const page = 1
      const sharedBool = false
      const finishedBool = true

      const mockData = [
        {
          ...mockItineraryData,
          userId,
          isCompleted: true,
          access: [],
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
        },
      ]
      const mockTotal = 1

      mockPrismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await service.findAllMyItineraries(
        userId,
        page,
        sharedBool,
        finishedBool
      )

      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId }, { access: { some: { userId } } }],
          isCompleted: true,
        },
        take: PAGINATION_LIMIT,
        skip: 0,
        orderBy: { startDate: 'asc' },
        include: expect.any(Object),
      })

      expect(result.data.length).toBe(1)
      expect(result.metadata.total).toBe(1)
    })

    it('should throw an error for invalid page number', async () => {
      await expect(
        service.findAllMyItineraries('user-123', 0, false, false)
      ).rejects.toThrow('Invalid page number')
    })

    it('should throw an error when page number exceeds total pages', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0])

      await expect(
        service.findAllMyItineraries('user-123', 2, false, false)
      ).rejects.toThrow('Page number exceeds total available pages')
    })
  })

  describe('findMySharedItineraries', () => {
    it('should return itineraries shared with the user', async () => {
      const userId = 'user-123'
      const page = 1

      const mockData = [
        {
          ...mockItineraryData,
          id: '2',
          userId: 'other-user',
          access: [
            {
              userId,
              user: {
                id: userId,
                firstName: 'John',
                lastName: 'Doe',
                photoProfile: null,
                email: 'john@example.com',
              },
            },
          ],
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
        },
      ]
      const mockTotal = 1

      mockPrismaService.$transaction.mockResolvedValue([mockData, mockTotal])

      const result = await service.findMySharedItineraries(userId, page)

      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { access: { some: { userId } } },
        take: PAGINATION_LIMIT,
        skip: 0,
        orderBy: { startDate: 'asc' },
        include: expect.any(Object),
      })

      expect(result).toEqual({
        data: expect.any(Array),
        metadata: {
          total: mockTotal,
          page,
          totalPages: Math.ceil(mockTotal / PAGINATION_LIMIT),
        },
      })

      expect(result.data[0].locationCount).toBe(1)
      expect(result.data[0].invitedUsers).toEqual([
        {
          id: userId,
          firstName: 'John',
          lastName: 'Doe',
          photoProfile: null,
          email: 'john@example.com',
        },
      ])
    })

    it('should return empty data when user has no shared itineraries', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0])

      const result = await service.findMySharedItineraries('user-123', 1)

      expect(result).toEqual({
        data: [],
        metadata: {
          total: 0,
          page: 1,
          totalPages: 1,
        },
      })
    })

    it('should throw an error for invalid page number', async () => {
      await expect(
        service.findMySharedItineraries('user-123', 0)
      ).rejects.toThrow('Invalid page number')
    })

    it('should throw an error when page number exceeds total pages', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0])

      await expect(
        service.findMySharedItineraries('user-123', 2)
      ).rejects.toThrow('Page number exceeds total available pages')
    })
  })

  describe('findMyCompletedItineraries', () => {
    it('should return completed itineraries with locationCount', async () => {
      // Mock data yang akan dikembalikan Prisma
      const mockItineraries = [
        {
          id: 'itinerary-1',
          userId: 'user-1',
          title: 'Trip ke Jepang',
          isCompleted: true,
          startDate: new Date(),
          sections: [
            { blocks: [{ blockType: 'LOCATION' }, { blockType: 'LOCATION' }] },
            { blocks: [{ blockType: 'LOCATION' }] },
          ],
          access: [],
          pendingInvites: [],
        },
        {
          id: 'itinerary-2',
          userId: 'user-1',
          title: 'Trip ke Bali',
          isCompleted: true,
          startDate: new Date(),
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
          access: [],
          pendingInvites: [],
        },
      ]

      // Set mock return value
      mockPrismaService.itinerary.findMany.mockResolvedValue(mockItineraries)

      // Panggil fungsi yang akan diuji
      const result = await service.findMyCompletedItineraries('user-1', 1)

      // Cek hasilnya sesuai dengan ekspektasi
      expect(result.data).toEqual([
        {
          id: 'itinerary-1',
          userId: 'user-1',
          title: 'Trip ke Jepang',
          isCompleted: true,
          startDate: expect.any(Date),
          sections: expect.any(Array),
          locationCount: 3, // Total lokasi dalam itinerary ini
          access: [],
          pendingInvites: [],
          invitedUsers: [],
        },
        {
          id: 'itinerary-2',
          userId: 'user-1',
          title: 'Trip ke Bali',
          isCompleted: true,
          startDate: expect.any(Date),
          sections: expect.any(Array),
          locationCount: 1, // Total lokasi dalam itinerary ini
          access: [],
          pendingInvites: [],
          invitedUsers: [],
        },
      ])

      // Pastikan findMany terpanggil dengan benar
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isCompleted: true },
        take: PAGINATION_LIMIT,
        skip: (1 - 1) * PAGINATION_LIMIT,
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
      })
    })

    it('should correctly count LOCATION blocks', async () => {
      // Mock response dari database
      mockPrismaService.itinerary.findMany.mockResolvedValue([
        {
          id: '1',
          userId: 'user123',
          isCompleted: false,
          sections: [
            {
              blocks: [{ blockType: 'LOCATION' }, { blockType: 'LOCATION' }],
            },
          ],
          pendingInvites: [],
          access: [],
        },
        {
          id: '2',
          userId: 'user123',
          isCompleted: false,
          sections: [
            {
              blocks: [{ blockType: 'LOCATION' }],
            },
          ],
          pendingInvites: [],
          access: [],
        },
      ])

      mockPrismaService.itinerary.count.mockResolvedValue(2)

      const result = await service.findMyItineraries('user123', 1)

      // Ensure blocks is always an array
      result.data.forEach((itinerary) => {
        itinerary.sections.forEach((section) => {
          section.blocks = section.blocks || []
        })
      })

      expect(result.data).toHaveLength(2)
      expect(result.data[0].locationCount).toBe(2) // itinerary pertama punya 2 LOCATION
      expect(result.data[1].locationCount).toBe(1) // itinerary kedua punya 1 LOCATION
    })

    it('should return an empty array when there are no completed itineraries', async () => {
      mockPrismaService.itinerary.findMany.mockResolvedValue([])

      const result = await service.findMyCompletedItineraries('user-2', 1)

      expect(result.data).toEqual([])
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalled()

      const findManyCall = mockPrismaService.itinerary.findMany.mock.calls[0][0]
      expect(findManyCall.where).toEqual({
        userId: 'user-2',
        isCompleted: true,
      })
      expect(findManyCall.orderBy).toEqual({ startDate: 'asc' })
      expect(findManyCall.include.sections.include.blocks.where).toEqual({
        blockType: 'LOCATION',
      })
    })
  })

  describe('markAsComplete', () => {
    it('should mark itinerary as complete', async () => {
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        mockItineraryData
      )
      mockPrismaService.itinerary.update = jest.fn().mockResolvedValue({
        ...mockItineraryData,
        isCompleted: true,
      })

      const result = await service.markAsComplete('1', 'user1')

      expect(mockPrismaService.itinerary.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isCompleted: true },
      })

      expect(result.isCompleted).toBe(true)
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      await expect(service.markAsComplete('1', 'user1')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if user is not the owner', async () => {
      const mockItinerary = { id: '1', userId: '999', isCompleted: false }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)

      await expect(service.markAsComplete('1', 'user1')).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('removeItinerary', () => {
    it('should remove an itinerary successfully', async () => {
      const itineraryId = 'ITN123'

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: itineraryId,
        userId: mockUser.id,
      })
      mockPrismaService.itinerary.delete.mockResolvedValue({ id: itineraryId })

      const result = await service.removeItinerary(itineraryId, mockUser)
      expect(result).toEqual({
        id: itineraryId,
      })

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })

      expect(mockPrismaService.itinerary.delete).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      const itineraryId = 'non-existent-id'

      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      await expect(
        service.removeItinerary(itineraryId, mockUser)
      ).rejects.toThrow(NotFoundException)

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })

      expect(mockPrismaService.itinerary.delete).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException when user is not the owner of the itinerary', async () => {
      const itineraryId = 'ITN456'
      const anotherUser = {
        ...mockUser,
        id: 'different-user-id',
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: itineraryId,
        userId: 'original-owner-id',
      })

      jest
        .spyOn(service, '_checkUpdateItineraryPermission')
        .mockImplementation(() => {
          throw new ForbiddenException(
            'You do not have permission to update this itinerary'
          )
        })

      await expect(
        service.removeItinerary(itineraryId, anotherUser)
      ).rejects.toThrow(ForbiddenException)

      expect(service._checkUpdateItineraryPermission).toHaveBeenCalledWith(
        itineraryId,
        anotherUser
      )
      expect(mockPrismaService.itinerary.delete).not.toHaveBeenCalled()
    })
  })

  describe('findAllTags', () => {
    it('should return an array of tags', async () => {
      const mockTags: Tag[] = [
        {
          id: '1',
          name: 'Beach',
          description: 'Beach destinations',
          iconUrl: 'beach-icon.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Adventure',
          description: 'Adventure activities',
          iconUrl: 'adventure-icon.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrismaService.tag.findMany.mockResolvedValue(mockTags)

      const result = await service.findAllTags()

      expect(prismaService.tag.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      })
      expect(result).toEqual(mockTags)
    })

    it('should return an empty array if there are no tags', async () => {
      mockPrismaService.tag.findMany.mockResolvedValue([])

      const result = await service.findAllTags()

      expect(prismaService.tag.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      })
      expect(result).toEqual([])
    })
  })

  describe('inviteToItinerary', () => {
    it('should send invitations to the provided emails', async () => {
      const itineraryId = 'itinerary-123'
      const emails = ['test1@example.com', 'test2@example.com']
      const userId = 'user-id'

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: itineraryId,
        userId,
      })

      mockPrismaService.pendingItineraryInvite.createMany.mockResolvedValue({
        count: emails.length,
      })

      const result = await service.inviteToItinerary(
        itineraryId,
        emails,
        userId
      )

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
      expect(
        mockPrismaService.pendingItineraryInvite.createMany
      ).toHaveBeenCalledWith({
        data: emails.map((email) => ({
          itineraryId,
          email,
        })),
        skipDuplicates: true,
      })
      expect(result).toEqual({ count: emails.length })
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      const itineraryId = 'non-existent-itinerary-id'
      const emails = ['test1@example.com', 'test2@example.com']
      const userId = 'user-id'

      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      await expect(
        service.inviteToItinerary(itineraryId, emails, userId)
      ).rejects.toThrow(
        new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
      )

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
      expect(
        mockPrismaService.pendingItineraryInvite.createMany
      ).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if user is not the owner of the itinerary', async () => {
      const itineraryId = 'itinerary-123'
      const emails = ['test1@example.com', 'test2@example.com']
      const userId = 'another-user-id'

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: itineraryId,
        userId: 'different-user-id',
      })

      await expect(
        service.inviteToItinerary(itineraryId, emails, userId)
      ).rejects.toThrow(
        new ForbiddenException(
          'Not authorized to invite users to this itinerary'
        )
      )

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
      expect(
        mockPrismaService.pendingItineraryInvite.createMany
      ).not.toHaveBeenCalled()
    })
  })

  describe('acceptItineraryInvitation', () => {
    it('should accept an itinerary invitation and link the user to the itinerary using itineraryId', async () => {
      const itineraryId = 'itinerary-456'

      const mockPendingInvite = {
        id: 'invite-123',
        itineraryId,
        email: mockUser.email,
      }

      const mockNewItineraryAccess = {
        id: 'access-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        itineraryId,
        userId: mockUser.id,
      }

      mockPrismaService.itinerary.findUnique = jest.fn().mockResolvedValue({
        id: itineraryId,
        access: [],
        pendingInvites: [mockPendingInvite],
      })

      mockPrismaService.itineraryAccess.create = jest
        .fn()
        .mockResolvedValue(mockNewItineraryAccess)

      mockPrismaService.pendingItineraryInvite.delete = jest
        .fn()
        .mockResolvedValue(mockPendingInvite)

      const result = await service.acceptItineraryInvitation(
        itineraryId,
        mockUser
      )

      expect(mockPrismaService.itineraryAccess.create).toHaveBeenCalledWith({
        data: {
          itineraryId,
          userId: mockUser.id,
        },
      })

      expect(
        mockPrismaService.pendingItineraryInvite.delete
      ).toHaveBeenCalledWith({
        where: { id: mockPendingInvite.id },
      })

      expect(result).toEqual(itineraryId)
    })

    it('should return itineraryId if user already has access to the itinerary', async () => {
      const itineraryId = 'itinerary-456'

      const mockExistingAccess = {
        id: 'access-123',
        itineraryId,
        userId: mockUser.id,
      }

      mockPrismaService.itinerary.findUnique = jest.fn().mockResolvedValue({
        id: itineraryId,
        access: [mockExistingAccess],
        pendingInvites: [],
      })

      const result = await service.acceptItineraryInvitation(
        itineraryId,
        mockUser
      )

      expect(mockPrismaService.itineraryAccess.create).not.toHaveBeenCalled()
      expect(
        mockPrismaService.pendingItineraryInvite.delete
      ).not.toHaveBeenCalled()

      expect(result).toEqual(itineraryId)
    })

    it('should throw NotFoundException if the pending invitation does not exist', async () => {
      const itineraryId = 'itinerary-123'

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: itineraryId,
        access: [],
        pendingInvites: [],
      })

      await expect(
        service.acceptItineraryInvitation(itineraryId, mockUser)
      ).rejects.toThrow(NotFoundException)

      expect(mockPrismaService.itineraryAccess.create).not.toHaveBeenCalled()
      expect(
        mockPrismaService.pendingItineraryInvite.delete
      ).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if itineraryId is not found when accepting an invitation', async () => {
      const itineraryId = 'itinerary-123'

      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      await expect(
        service.acceptItineraryInvitation(itineraryId, mockUser)
      ).rejects.toThrow(
        new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
      )

      expect(mockPrismaService.itineraryAccess.create).not.toHaveBeenCalled()
      expect(
        mockPrismaService.pendingItineraryInvite.delete
      ).not.toHaveBeenCalled()
    })

    it('should throw NotFound if user email is not found to accept the invitation', async () => {
      const itineraryId = 'itinerary-123'

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: itineraryId,
        access: [],
        pendingInvites: [],
      })

      await expect(
        service.acceptItineraryInvitation(itineraryId, mockUser)
      ).rejects.toThrow(new NotFoundException(`Invitation not found`))

      expect(mockPrismaService.itineraryAccess.create).not.toHaveBeenCalled()
      expect(
        mockPrismaService.pendingItineraryInvite.delete
      ).not.toHaveBeenCalled()
    })
  })

  describe('removeUserFromItinerary', () => {
    it('should remove a user from the itinerary successfully', async () => {
      const itineraryId = 'itinerary-123'
      const userTargetId = 'user-target-123'

      const mockDeletedAccess = {
        id: 'access-123',
        itineraryId,
        userId: userTargetId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue({
        id: itineraryId,
        userId: mockUser.id,
      })
      mockPrismaService.itineraryAccess.findUnique.mockResolvedValue({
        id: itineraryId,
        userId: userTargetId,
      })
      mockPrismaService.itineraryAccess.delete.mockResolvedValue(
        mockDeletedAccess
      )

      const result = await service.removeUserFromItinerary(
        itineraryId,
        userTargetId,
        mockUser
      )

      expect(mockPrismaService.itineraryAccess.delete).toHaveBeenCalledWith({
        where: {
          itineraryId_userId: {
            itineraryId,
            userId: userTargetId,
          },
        },
      })

      expect(result).toEqual(mockDeletedAccess)
    })
    it('should throw NotFoundException if the itinerary does not exist', async () => {
      const itineraryId = 'non-existent-itinerary'
      const userTargetId = 'user-target-123'

      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      await expect(
        service.removeUserFromItinerary(itineraryId, userTargetId, mockUser)
      ).rejects.toThrow(
        new NotFoundException(`Itinerary with ID ${itineraryId} not found`)
      )

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
      expect(mockPrismaService.itineraryAccess.delete).not.toHaveBeenCalled()
    })

    it('should throw ForbiddenException if the user is not the owner of the itinerary', async () => {
      const itineraryId = 'itinerary-123'
      const userTargetId = 'user-target-123'

      const mockItinerary = {
        id: itineraryId,
        userId: 'another-user-id',
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)
      await expect(
        service.removeUserFromItinerary(itineraryId, userTargetId, mockUser)
      ).rejects.toThrow(
        new ForbiddenException(
          'You are not authorized to remove users from this itinerary'
        )
      )

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
      expect(mockPrismaService.itineraryAccess.delete).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if the user to be removed is not a participant', async () => {
      const itineraryId = 'itinerary-123'
      const userTargetId = 'non-existent-user'

      const mockItinerary = {
        id: itineraryId,
        userId: mockUser.id,
      }

      mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)
      mockPrismaService.itineraryAccess.findUnique.mockResolvedValue(null)

      await expect(
        service.removeUserFromItinerary(itineraryId, userTargetId, mockUser)
      ).rejects.toThrow(
        new NotFoundException(
          `User with ID ${userTargetId} is not a participant of this itinerary`
        )
      )

      expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
      expect(mockPrismaService.itineraryAccess.findUnique).toHaveBeenCalledWith(
        {
          where: {
            itineraryId_userId: {
              itineraryId,
              userId: userTargetId,
            },
          },
        }
      )
      expect(mockPrismaService.itineraryAccess.delete).not.toHaveBeenCalled()
    })
  })

  describe('findContingencyPlans', () => {
    it('should return all contingency plans for the given itinerary', async () => {
      const itineraryId = 'itinerary-123'
      const mockContingencyPlans = [
        {
          id: 'contingency-plan-123',
          title: 'Contingency Plan 1',
          sections: [],
        },
        {
          id: 'contingency-plan-456',
          title: 'Contingency Plan 2',
          sections: [],
        },
      ]

      mockPrismaService.contingencyPlan.findMany.mockResolvedValue(
        mockContingencyPlans
      )

      const result = await service.findContingencyPlans(itineraryId, mockUser)
      expect(result).toEqual(mockContingencyPlans)
    })
  })

  it('should create a contingency plan with sections and blocks', async () => {
    // Arrange
    const createContingencyPlanDto: CreateContingencyPlanDto = {
      title: 'Plan B', // This will be overridden by the service
      description: 'Backup plan',
      sections: [
        {
          sectionNumber: 1,
          title: 'Section 1',
          blocks: [
            {
              blockType: 'LOCATION',
              title: 'Block 1',
              description: 'Block 1 Description',
              startTime: new Date('2025-03-10T14:00:00Z'),
              endTime: new Date('2025-03-10T15:00:00Z'),
              location: 'Location 1',
              price: 100,
              photoUrl: 'photo1.jpg',
              position: 0,
              routeToNext: {
                sourceBlockId: 'source-block-1',
                destinationBlockId: 'destination-block-1',
                distance: 5000,
                duration: 900,
                polyline: 'abc123',
                transportMode: TRANSPORT_MODE.DRIVE,
              },
            },
          ],
        },
      ],
    }

    const mockItinerary = {
      id: 'itinerary-123',
      userId: mockUser.id,
    }

    const contingencyCount = 0

    const expectedContingencyPlan = {
      id: 'contingency-plan-123',
      itineraryId: 'itinerary-123',
      title: 'Plan B', // Service determines this based on contingencyCount
      description: 'Backup plan',
      sections: [
        {
          id: 'section-1',
          sectionNumber: 1001, // Modified by the service (sectionNumber + (contingencyCount + 1) * 1000)
          title: 'Section 1',
          blocks: [
            {
              id: 'block-1',
              position: 0,
              blockType: 'LOCATION',
              title: 'Block 1',
              description: 'Block 1 Description',
              startTime: new Date('2025-03-10T14:00:00Z'),
              endTime: new Date('2025-03-10T15:00:00Z'),
              location: 'Location 1',
              price: 100,
              photoUrl: 'photo1.jpg',
              routeToNext: null,
              routeFromPrevious: null,
            },
          ],
        },
      ],
    }

    // Expected result with mapped section numbers
    const expectedResult = {
      ...expectedContingencyPlan,
      sections: [
        {
          ...expectedContingencyPlan.sections[0],
          sectionNumber: 1, // Mapped back to original (sectionNumber % 1000)
        },
      ],
    }

    mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)
    mockPrismaService.contingencyPlan.count.mockResolvedValue(contingencyCount)
    mockPrismaService.contingencyPlan.create.mockResolvedValue(
      expectedContingencyPlan
    )
    mockPrismaService.route.create.mockResolvedValue({
      id: 'route-1',
      sourceBlockId: 'block-1',
      destinationBlockId: 'block-2',
      distance: 5000,
      duration: 900,
      polyline: 'abc123',
      transportMode: TRANSPORT_MODE.DRIVE,
    })
    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      const result = await callback(mockPrismaService)
      return result
    })

    // Act
    const result = await service.createContingencyPlan(
      mockItinerary.id,
      createContingencyPlanDto,
      mockUser
    )

    expect(mockPrismaService.$transaction).toHaveBeenCalled()
    expect(mockPrismaService.contingencyPlan.create).toHaveBeenCalledWith({
      data: {
        itineraryId: mockItinerary.id,
        title: 'Plan B', // Determined by CONTINGENCY_TITLE[contingencyCount]
        description: createContingencyPlanDto.description,
        sections: {
          create: [
            {
              sectionNumber: 1001, // 1 + (0 + 1) * 1000
              title: 'Section 1',
              itinerary: {
                connect: { id: mockItinerary.id },
              },
              blocks: {
                create: [
                  {
                    position: 0,
                    blockType: 'LOCATION',
                    title: 'Block 1',
                    description: 'Block 1 Description',
                    startTime: new Date('2025-03-10T14:00:00Z'),
                    endTime: new Date('2025-03-10T15:00:00Z'),
                    location: 'Location 1',
                    price: 100,
                    photoUrl: 'photo1.jpg',
                  },
                ],
              },
            },
          ],
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

    expect(result).toEqual(expectedResult)
  })

  it('should throw NotFoundException if itinerary does not exist', async () => {
    const itineraryId = 'non-existent-itinerary'

    // Arrange
    const createContingencyPlanDto: CreateContingencyPlanDto = {
      title: 'Contingency Plan Title',
      description: 'Contingency Plan Description',
      sections: [],
    }

    mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

    // Act & Assert
    await expect(
      service.createContingencyPlan(
        itineraryId,
        createContingencyPlanDto,
        mockUser
      )
    ).rejects.toThrow(NotFoundException)
    expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
      where: { id: itineraryId },
      include: {
        access: {
          where: {
            userId: mockUser.id,
          },
        },
      },
    })
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
  })

  it('should throw ForbiddenException if user does not own the itinerary', async () => {
    const itineraryId = 'non-existent-itinerary'
    // Arrange
    const createContingencyPlanDto: CreateContingencyPlanDto = {
      title: 'Contingency Plan Title',
      description: 'Contingency Plan Description',
      sections: [],
    }

    const mockItinerary = {
      id: 'itinerary-123',
      userId: 'another-user-id',
      access: [],
    }

    mockPrismaService.itinerary.findUnique.mockResolvedValue(mockItinerary)
    // Act & Assert
    await expect(
      service.createContingencyPlan(
        itineraryId,
        createContingencyPlanDto,
        mockUser
      )
    ).rejects.toThrow(ForbiddenException)
    expect(mockPrismaService.itinerary.findUnique).toHaveBeenCalledWith({
      where: { id: itineraryId },
      include: {
        access: {
          where: {
            userId: mockUser.id,
          },
        },
      },
    })
    expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
  })
})
