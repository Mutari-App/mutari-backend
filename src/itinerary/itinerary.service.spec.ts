import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { BLOCK_TYPE, User, Prisma } from '@prisma/client'
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
          }
        ]
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
            set: [],
            create: [
              { tag: { connect: { id: 'tag-123' } } },
            ],
          },
          sections: {
            deleteMany: {},
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
                } 
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
      expect(result).toEqual(updatedItinerary)
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
})
