import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'
import { PrismaService } from '../prisma/prisma.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { BLOCK_TYPE, User } from '@prisma/client'
import { BadRequestException, NotFoundException } from '@nestjs/common'

describe('ItineraryService', () => {
  let service: ItineraryService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService

  const mockPrismaService = {
    $transaction: jest
      .fn()
      .mockImplementation((callback) => callback(mockPrismaService)),
    itinerary: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    tag: {
      findMany: jest.fn(),
    },
    itineraryAccess: {
      findUnique: jest.fn(),
    },
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<ItineraryService>(ItineraryService)
    prismaService = module.get<PrismaService>(PrismaService)
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
})
