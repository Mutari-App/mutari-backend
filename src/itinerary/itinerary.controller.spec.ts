/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { BLOCK_TYPE, User } from '@prisma/client'
import { HttpStatus, NotFoundException } from '@nestjs/common'
import { find } from 'rxjs'

describe('ItineraryController', () => {
  let controller: ItineraryController
  let itineraryService: ItineraryService
  let responseUtil: ResponseUtil

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

  const mockItineraryService = {
    createItinerary: jest.fn(),
    findOne: jest.fn(),
  }

  const mockResponseUtil = {
    response: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItineraryController],
      providers: [
        {
          provide: ItineraryService,
          useValue: mockItineraryService,
        },
        {
          provide: ResponseUtil,
          useValue: mockResponseUtil,
        },
      ],
    }).compile()

    controller = module.get<ItineraryController>(ItineraryController)
    itineraryService = module.get<ItineraryService>(ItineraryService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findOne', () => {
    it('should return an itinerary when found', async () => {
      const mockItinerary = {
        id: 'ITN-123',
        userId: 'USR-123',
        title: 'Trip to Bali',
        description: 'Bali with friends',
        coverImage: 'https://example.com/image.jpg',
        startDate: new Date(),
        endDate: new Date(),
        isPublished: true,
        isCompleted: false,
        updatedAt: new Date(),
        createdAt: new Date(),
        sections: [
          {
            id: 'section1',
            itineraryId: 'ITN-123',
            sectionNumber: 1,
            updatedAt: new Date(),
            createdAt: new Date(),
            title: 'Section 1',
            blocks: [
              {
                id: 'block1',
                updatedAt: new Date(),
                createdAt: new Date(),
                title: 'Block Title',
                description: 'Block Description',
                sectionId: 'section1',
                position: 1,
                blockType: BLOCK_TYPE.LOCATION,
                startTime: new Date(),
                endTime: new Date(),
                location: 'New York',
                price: 100,
                photoUrl: 'https://example.com/photo.jpg',
              },
            ],
          },
        ],
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itinerary fetched successfully.',
        data: mockItinerary,
      }

      mockItineraryService.findOne.mockResolvedValue(mockItinerary)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findOne('ITN-123')

      expect(itineraryService.findOne).toHaveBeenCalledWith('ITN-123')
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itinerary fetched successfully.',
        },
        { data: mockItinerary }
      )
      expect(result).toBe(mockResponse)
    })

    it('should throw NotFoundException if itinerary is not found', async () => {
      mockItineraryService.findOne.mockResolvedValue(null)

      await expect(controller.findOne('INVALID_ID')).rejects.toThrow(
        new NotFoundException('Itinerary with ID INVALID_ID not found')
      )
  })

  describe('createItinerary', () => {
    it('should create an itinerary and return a formatted response', async () => {
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
        ],
      }

      const mockCreatedItinerary = {
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
              // Block details omitted for brevity
            ],
          },
        ],
        tags: [
          // Tag details omitted for brevity
        ],
      }

      const mockResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary created successfully',
        data: mockCreatedItinerary,
      }

      mockItineraryService.createItinerary.mockResolvedValue(
        mockCreatedItinerary
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      // Act
      const result = await controller.createItinerary(
        mockUser,
        createItineraryDto
      )

      // Assert
      expect(mockItineraryService.createItinerary).toHaveBeenCalledWith(
        createItineraryDto,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Itinerary created successfully',
        },
        mockCreatedItinerary
      )
      expect(result).toEqual(mockResponse)
    })

    it('should pass errors from service to the caller', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Problem Trip',
        description: 'A trip that will cause an error',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-03-10'), // Invalid date range
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [],
          },
        ],
      }

      const mockError = new Error('Start date must be before end date')
      mockItineraryService.createItinerary.mockRejectedValue(mockError)

      // Act & Assert
      await expect(
        controller.createItinerary(mockUser, createItineraryDto)
      ).rejects.toThrow(mockError)

      expect(mockItineraryService.createItinerary).toHaveBeenCalledWith(
        createItineraryDto,
        mockUser
      )
      expect(mockResponseUtil.response).not.toHaveBeenCalled()
    })

    it('should create an itinerary without tags', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Mountain Trip',
        description: 'A hiking trip',
        startDate: new Date('2025-04-10'),
        endDate: new Date('2025-04-15'),
        coverImage: 'mountain.jpg',
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [
              {
                blockType: BLOCK_TYPE.LOCATION,
                title: 'Hotel A',
                description: 'Check in at the hotel',
                position: 0,
                startTime: new Date('2025-04-10T14:00:00Z'),
                endTime: new Date('2025-04-10T15:00:00Z'),
                location: 'Mountain Hotel',
                price: 400000,
                photoUrl: 'hotel.jpg',
              },
            ],
          },
        ],
      }

      const mockCreatedItinerary = {
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
            id: 'section-3',
            itineraryId: 'itinerary-456',
            sectionNumber: 1,
            title: 'Day 1',
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [
              // Block details omitted for brevity
            ],
          },
        ],
        tags: [],
      }

      const mockResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary created successfully',
        data: mockCreatedItinerary,
      }

      mockItineraryService.createItinerary.mockResolvedValue(
        mockCreatedItinerary
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      // Act
      const result = await controller.createItinerary(
        mockUser,
        createItineraryDto
      )

      // Assert
      expect(mockItineraryService.createItinerary).toHaveBeenCalledWith(
        createItineraryDto,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Itinerary created successfully',
        },
        mockCreatedItinerary
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle optional fields in the DTO correctly', async () => {
      // Arrange
      const createItineraryDto: CreateItineraryDto = {
        title: 'Minimal Trip',
        description: null, // Test with null value
        startDate: new Date('2025-05-10'),
        endDate: new Date('2025-05-15'),
        // No coverImage
        // No tags
        sections: [
          {
            sectionNumber: 1,
            // No title, should use default
            blocks: [], // Empty blocks
          },
        ],
      }

      const mockCreatedItinerary = {
        id: 'itinerary-789',
        userId: mockUser.id,
        title: createItineraryDto.title,
        description: null,
        coverImage: null,
        startDate: new Date(createItineraryDto.startDate),
        endDate: new Date(createItineraryDto.endDate),
        isPublished: false,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        sections: [
          {
            id: 'section-4',
            itineraryId: 'itinerary-789',
            sectionNumber: 1,
            title: 'Hari ke-1', // Default title
            createdAt: new Date(),
            updatedAt: new Date(),
            blocks: [],
          },
        ],
        tags: [],
      }

      const mockResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary created successfully',
        data: mockCreatedItinerary,
      }

      mockItineraryService.createItinerary.mockResolvedValue(
        mockCreatedItinerary
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      // Act
      const result = await controller.createItinerary(
        mockUser,
        createItineraryDto
      )

      // Assert
      expect(mockItineraryService.createItinerary).toHaveBeenCalledWith(
        createItineraryDto,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Itinerary created successfully',
        },
        mockCreatedItinerary
      )
      expect(result).toEqual(mockResponse)
    })
  })
})
})
