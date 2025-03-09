import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { BLOCK_TYPE, User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'

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
      count: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
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

  describe('findMyItineraries', () => {
    it('should return paginated itineraries', async () => {
      const mockData = [mockItineraryData]
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
        data: mockData,
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
        },
        {
          id: 'itinerary-2',
          userId: 'user-1',
          title: 'Trip ke Bali',
          isCompleted: true,
          startDate: new Date(),
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
        },
      ]

      // Set mock return value
      mockPrismaService.itinerary.findMany.mockResolvedValue(mockItineraries)

      // Panggil fungsi yang akan diuji
      const result = await service.findMyCompletedItineraries('user-1')

      // Cek hasilnya sesuai dengan ekspektasi
      expect(result).toEqual([
        {
          id: 'itinerary-1',
          userId: 'user-1',
          title: 'Trip ke Jepang',
          isCompleted: true,
          startDate: expect.any(Date),
          sections: expect.any(Array),
          locationCount: 3, // Total lokasi dalam itinerary ini
        },
        {
          id: 'itinerary-2',
          userId: 'user-1',
          title: 'Trip ke Bali',
          isCompleted: true,
          startDate: expect.any(Date),
          sections: expect.any(Array),
          locationCount: 1, // Total lokasi dalam itinerary ini
        },
      ])

      // Pastikan findMany terpanggil dengan benar
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isCompleted: true },
        orderBy: { startDate: 'asc' },
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
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
        },
      ])

      mockPrismaService.itinerary.count.mockResolvedValue(2)

      const result = await service.findMyItineraries('user123', 1)

      expect(result.data).toHaveLength(2)
      expect(result.data[0].locationCount).toBe(2) // itinerary pertama punya 2 LOCATION
      expect(result.data[1].locationCount).toBe(1) // itinerary kedua punya 1 LOCATION
    })

    it('should return an empty array when there are no completed itineraries', async () => {
      // Mock return value kosong
      mockPrismaService.itinerary.findMany.mockResolvedValue([])

      const result = await service.findMyCompletedItineraries('user-2')

      expect(result).toEqual([])
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-2', isCompleted: true },
        orderBy: { startDate: 'asc' },
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
              },
            },
          },
        },
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
})
