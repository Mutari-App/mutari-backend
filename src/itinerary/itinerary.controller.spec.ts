import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { BLOCK_TYPE, Tag, User } from '@prisma/client'

import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'

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
    updateItinerary: jest.fn(),
    findMyItineraries: jest.fn(),
    findAllMyItineraries: jest.fn(),
    findMySharedItineraries: jest.fn(),
    markAsComplete: jest.fn(),
    findMyCompletedItineraries: jest.fn(),
    findOne: jest.fn(),
    removeItinerary: jest.fn(),
    findAllTags: jest.fn(),
    inviteToItinerary: jest.fn(),
    acceptItineraryInvitation: jest.fn(),
    removeUserFromItinerary: jest.fn(),
    findContingencyPlans: jest.fn(),
    findContingencyPlan: jest.fn(),
    createContingencyPlan: jest.fn(),
    selectContingencyPlan: jest.fn(),
    updateContingencyPlan: jest.fn(),
    searchItineraries: jest.fn(),
    createViewItinerary: jest.fn(),
    getViewItinerary: jest.fn(),
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
        userId: 'user-123',
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

      const result = await controller.findOne('ITN-123', mockUser)

      expect(itineraryService.findOne).toHaveBeenCalledWith('ITN-123', mockUser)
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

      const result = await controller.findOne('INVALID_ID', mockUser)

      expect(result).toEqual({
        statusCode: HttpStatus.NOT_FOUND,
      })
    })

    it('should throw ForbiddenException if user is not authorized', async () => {
      mockItineraryService.findOne.mockRejectedValue(new ForbiddenException())

      await expect(controller.findOne('1', mockUser)).rejects.toThrow(
        ForbiddenException
      )
    })
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

  describe('findMyItineraries', () => {
    it('should return itineraries successfully', async () => {
      const mockResult = {
        data: [{ id: 1, userId: 'user1' }],
        total: 10,
        page: 1,
        totalPages: 1,
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        data: mockResult,
      }

      mockItineraryService.findMyItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findMyItineraries(mockUser, { page: '1' })

      expect(mockItineraryService.findMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itineraries fetched successfully.',
        },
        { itinerary: mockResult }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw an error for invalid page number', async () => {
      mockItineraryService.findMyItineraries.mockRejectedValue(
        new HttpException('Invalid page number', 400)
      )

      await expect(
        controller.findMyItineraries(mockUser, { page: '0' })
      ).rejects.toThrow('Invalid page number')

      expect(mockItineraryService.findMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        0
      )
    })

    it('should return empty data when there are no itineraries', async () => {
      const mockResult = { data: [], total: 0, page: 1, totalPages: 1 }
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        response: mockResult,
      }
      mockItineraryService.findMyItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      const result = await controller.findMyItineraries(mockUser, { page: '1' })

      expect(mockItineraryService.findMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('findAllMyItineraries', () => {
    it('should return all itineraries with default parameters', async () => {
      const mockResult = {
        data: [{ id: 1, title: 'Test Itinerary', userId: 'user-123' }],
        total: 1,
        page: 1,
        totalPages: 1,
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'All itineraries fetched successfully.',
        data: mockResult,
      }

      mockItineraryService.findAllMyItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findAllMyItineraries(
        mockUser,
        { page: '1' },
        undefined,
        undefined
      )

      expect(mockItineraryService.findAllMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1,
        false,
        false
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'All itineraries fetched successfully.',
        },
        { itinerary: mockResult }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should filter itineraries with shared=true and finished=true', async () => {
      const mockResult = {
        data: [
          {
            id: 2,
            title: 'Shared Completed Trip',
            userId: 'user-123',
            isCompleted: true,
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'All itineraries fetched successfully.',
        data: mockResult,
      }

      mockItineraryService.findAllMyItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findAllMyItineraries(
        mockUser,
        { page: '1' },
        'true',
        'true'
      )

      expect(mockItineraryService.findAllMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1,
        true,
        true
      )
      expect(result).toEqual(mockResponse)
    })

    it('should filter itineraries with shared=false and finished=false', async () => {
      const mockResult = {
        data: [
          {
            id: 3,
            title: 'Private Ongoing Trip',
            userId: 'user-123',
            isCompleted: false,
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'All itineraries fetched successfully.',
        data: mockResult,
      }

      mockItineraryService.findAllMyItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findAllMyItineraries(
        mockUser,
        { page: '1' },
        'false',
        'false'
      )

      expect(mockItineraryService.findAllMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1,
        false,
        false
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle service errors correctly', async () => {
      const errorMessage = 'Failed to retrieve itineraries'
      mockItineraryService.findAllMyItineraries.mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(
        controller.findAllMyItineraries(mockUser, { page: '1' })
      ).rejects.toThrow(errorMessage)

      expect(mockItineraryService.findAllMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1,
        false,
        false
      )
    })
  })

  describe('findMySharedItineraries', () => {
    it('should return shared itineraries successfully', async () => {
      const mockResult = {
        data: [
          { id: 4, title: 'Shared Trip 1', userId: 'other-user' },
          { id: 5, title: 'Shared Trip 2', userId: 'another-user' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Shared itineraries fetched successfully.',
        data: mockResult,
      }

      mockItineraryService.findMySharedItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findMyShareditineraries(mockUser, {
        page: '1',
      })

      expect(mockItineraryService.findMySharedItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Shared itineraries fetched successfully.',
        },
        { itinerary: mockResult }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should return empty data when there are no shared itineraries', async () => {
      const mockResult = { data: [], total: 0, page: 1, totalPages: 0 }
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Shared itineraries fetched successfully.',
        data: mockResult,
      }

      mockItineraryService.findMySharedItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findMyShareditineraries(mockUser, {
        page: '1',
      })

      expect(mockItineraryService.findMySharedItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle service errors for shared itineraries', async () => {
      const errorMessage = 'Failed to retrieve shared itineraries'
      mockItineraryService.findMySharedItineraries.mockRejectedValue(
        new Error(errorMessage)
      )

      await expect(
        controller.findMyShareditineraries(mockUser, { page: '1' })
      ).rejects.toThrow(errorMessage)

      expect(mockItineraryService.findMySharedItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1
      )
    })
  })

  describe('markAsComplete', () => {
    it('should mark itinerary as complete', async () => {
      const mockItinerary = { id: '1', userId: '123', isCompleted: true }
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: mockItinerary,
      }

      mockItineraryService.markAsComplete.mockResolvedValue(mockItinerary)
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      const result = await controller.markAsComplete('1', mockUser)

      expect(mockItineraryService.markAsComplete).toHaveBeenCalledWith(
        '1',
        'user-123'
      )
      expect(result.itinerary.isCompleted).toBe(true)
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      mockItineraryService.markAsComplete.mockRejectedValue(
        new NotFoundException()
      )

      await expect(controller.markAsComplete('1', mockUser)).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockItineraryService.markAsComplete.mockRejectedValue(
        new ForbiddenException()
      )

      await expect(controller.markAsComplete('1', mockUser)).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('findMyCompletedItineraries', () => {
    it('should return completed itineraries with response formatting', async () => {
      const mockUser: User = { id: 'user-1' } as User
      const mockItineraries = [
        {
          id: 'itinerary-1',
          title: 'Trip ke Jepang',
          isCompleted: true,
          locationCount: 3,
        },
        {
          id: 'itinerary-2',
          title: 'Trip ke Bali',
          isCompleted: true,
          locationCount: 1,
        },
      ]
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: mockItineraries,
      }

      // Mock service response
      mockItineraryService.findMyCompletedItineraries.mockResolvedValue(
        mockItineraries
      )
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      // Call controller method
      const result = await controller.findMyCompletedItineraries(mockUser, {
        page: '1',
      })

      // Expected response
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: mockItineraries,
      })

      // Ensure service method called correctly
      expect(
        mockItineraryService.findMyCompletedItineraries
      ).toHaveBeenCalledWith('user-1', 1)

      // Ensure responseUtil.response called correctly
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itineraries fetched successfully.',
        },
        {
          itinerary: mockItineraries,
        }
      )
    })

    it('should return empty itinerary array if no completed itineraries found', async () => {
      const mockUser: User = { id: 'user-2' } as User
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: [],
      }

      mockItineraryService.findMyCompletedItineraries.mockResolvedValue([])
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      const result = await controller.findMyCompletedItineraries(mockUser, {
        page: '1',
      })

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: [],
      })

      expect(
        mockItineraryService.findMyCompletedItineraries
      ).toHaveBeenCalledWith('user-2', 1)
    })
  })

  describe('findMyItineraries', () => {
    it('should return itineraries successfully', async () => {
      const mockResult = {
        data: [{ id: 1, userId: 'user1' }],
        total: 10,
        page: 1,
        totalPages: 1,
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        data: mockResult,
      }

      mockItineraryService.findMyItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findMyItineraries(mockUser, { page: '1' })

      expect(mockItineraryService.findMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itineraries fetched successfully.',
        },
        { itinerary: mockResult }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw an error for invalid page number', async () => {
      mockItineraryService.findMyItineraries.mockRejectedValue(
        new HttpException('Invalid page number', 400)
      )

      await expect(
        controller.findMyItineraries(mockUser, { page: '0' })
      ).rejects.toThrow('Invalid page number')

      expect(mockItineraryService.findMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        0
      )
    })

    it('should return empty data when there are no itineraries', async () => {
      const mockResult = { data: [], total: 0, page: 1, totalPages: 1 }
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        response: mockResult,
      }
      mockItineraryService.findMyItineraries.mockResolvedValue(mockResult)
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      const result = await controller.findMyItineraries(mockUser, { page: '1' })

      expect(mockItineraryService.findMyItineraries).toHaveBeenCalledWith(
        mockUser.id,
        1
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('markAsComplete', () => {
    it('should mark itinerary as complete', async () => {
      const mockItinerary = { id: '1', userId: '123', isCompleted: true }
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: mockItinerary,
      }

      mockItineraryService.markAsComplete.mockResolvedValue(mockItinerary)
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      const result = await controller.markAsComplete('1', mockUser)

      expect(mockItineraryService.markAsComplete).toHaveBeenCalledWith(
        '1',
        'user-123'
      )
      expect(result.itinerary.isCompleted).toBe(true)
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      mockItineraryService.markAsComplete.mockRejectedValue(
        new NotFoundException()
      )

      await expect(controller.markAsComplete('1', mockUser)).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockItineraryService.markAsComplete.mockRejectedValue(
        new ForbiddenException()
      )

      await expect(controller.markAsComplete('1', mockUser)).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('findMyCompletedItineraries', () => {
    it('should return completed itineraries with response formatting', async () => {
      const mockUser: User = { id: 'user-1' } as User
      const mockItineraries = [
        {
          id: 'itinerary-1',
          title: 'Trip ke Jepang',
          isCompleted: true,
          locationCount: 3,
        },
        {
          id: 'itinerary-2',
          title: 'Trip ke Bali',
          isCompleted: true,
          locationCount: 1,
        },
      ]
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: mockItineraries,
      }

      // Mock service response
      mockItineraryService.findMyCompletedItineraries.mockResolvedValue(
        mockItineraries
      )
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      // Call controller method
      const result = await controller.findMyCompletedItineraries(mockUser, {
        page: '1',
      })

      // Expected response
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: mockItineraries,
      })

      // Ensure service method called correctly
      expect(
        mockItineraryService.findMyCompletedItineraries
      ).toHaveBeenCalledWith('user-1', 1)

      // Ensure responseUtil.response called correctly
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itineraries fetched successfully.',
        },
        {
          itinerary: mockItineraries,
        }
      )
    })

    it('should return empty itinerary array if no completed itineraries found', async () => {
      const mockUser: User = { id: 'user-2' } as User
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: [],
      }

      mockItineraryService.findMyCompletedItineraries.mockResolvedValue([])
      mockResponseUtil.response.mockResolvedValue(mockResponse)

      const result = await controller.findMyCompletedItineraries(mockUser, {
        page: '1',
      })

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: [],
      })

      expect(
        mockItineraryService.findMyCompletedItineraries
      ).toHaveBeenCalledWith('user-2', 1)
    })
  })

  describe('updateItinerary', () => {
    it('should update an itinerary and return a formatted response', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
        title: 'Updated Beach Trip',
        description: 'An updated relaxing beach vacation',
        startDate: new Date('2025-03-11'),
        endDate: new Date('2025-03-16'),
        coverImage: 'beach2.jpg',
        tags: ['tag-123', 'tag-456'],
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

      const mockUpdatedItinerary = {
        id: 'itinerary-123',
        userId: mockUser.id,
        title: updateItineraryDto.title,
        description: updateItineraryDto.description,
        coverImage: updateItineraryDto.coverImage,
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
              // Block details omitted for brevity
            ],
          },
        ],
        tags: [
          // Tag details omitted for brevity
        ],
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itinerary updated successfully',
        data: mockUpdatedItinerary,
      }

      mockItineraryService.updateItinerary.mockResolvedValue(
        mockUpdatedItinerary
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      // Act
      const result = await controller.updateItinerary(
        'itinerary-123',
        mockUser,
        updateItineraryDto
      )

      // Assert
      expect(mockItineraryService.updateItinerary).toHaveBeenCalledWith(
        'itinerary-123',
        updateItineraryDto,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itinerary updated successfully',
        },
        mockUpdatedItinerary
      )
      expect(result).toEqual(mockResponse)
    })

    it('should pass errors from service to the caller', async () => {
      // Arrange
      const updateItineraryDto: UpdateItineraryDto = {
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

      const mockError = new Error('Itinerary with ID non-existent-id not found')
      mockItineraryService.updateItinerary.mockRejectedValue(mockError)

      // Act & Assert
      await expect(
        controller.updateItinerary(
          'non-existent-id',
          mockUser,
          updateItineraryDto
        )
      ).rejects.toThrow(mockError)

      expect(mockItineraryService.updateItinerary).toHaveBeenCalledWith(
        'non-existent-id',
        updateItineraryDto,
        mockUser
      )
      expect(mockResponseUtil.response).not.toHaveBeenCalled()
    })
  })

  describe('removeItinerary', () => {
    it('should call remove() in the service and delete an itinerary', async () => {
      const itineraryId = 'ITN123'
      mockItineraryService.removeItinerary.mockResolvedValue(undefined)

      const responseMock = {
        statusCode: HttpStatus.OK,
        message: 'Itinerary deleted successfully.',
      }

      jest.spyOn(responseUtil, 'response').mockReturnValue(responseMock)

      const result = await controller.removeItinerary(itineraryId, mockUser)

      expect(mockItineraryService.removeItinerary).toHaveBeenCalledWith(
        itineraryId,
        mockUser
      )
      expect(responseUtil.response).toHaveBeenCalledWith(responseMock)
      expect(result).toEqual(responseMock)
    })
    it('should throw an error if itinerary is not found', async () => {
      const itineraryId = 'non-existent-id'
      const error = new Error('Not Found')

      mockItineraryService.removeItinerary.mockRejectedValue(error)

      await expect(
        controller.removeItinerary(itineraryId, mockUser)
      ).rejects.toThrow('Not Found')

      expect(mockItineraryService.removeItinerary).toHaveBeenCalledWith(
        itineraryId,
        mockUser
      )
    })
  })

  describe('findAllTags', () => {
    it('should return all tags', async () => {
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

      const expectedResponse = {
        success: true,
        code: HttpStatus.OK,
        message: 'Tags fetched successfully.',
        data: {
          tags: mockTags,
        },
      }

      mockItineraryService.findAllTags.mockResolvedValue(mockTags)
      mockResponseUtil.response.mockReturnValue(expectedResponse)

      const result = await controller.findAllTags()

      expect(mockItineraryService.findAllTags).toHaveBeenCalled()
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Tags fetched successfully.',
        },
        {
          tags: mockTags,
        }
      )
      expect(result).toEqual(expectedResponse)
    })

    it('should return an empty array if no tags are found', async () => {
      const mockTags: Tag[] = []

      const expectedResponse = {
        success: true,
        code: HttpStatus.OK,
        message: 'Tags fetched successfully.',
        data: {
          tags: mockTags,
        },
      }

      mockItineraryService.findAllTags.mockResolvedValue(mockTags)
      mockResponseUtil.response.mockReturnValue(expectedResponse)

      const result = await controller.findAllTags()

      expect(mockItineraryService.findAllTags).toHaveBeenCalled()
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Tags fetched successfully.',
        },
        {
          tags: mockTags,
        }
      )
      expect(result).toEqual(expectedResponse)
    })
  })

  describe('inviteToItinerary', () => {
    it('should invite a user to an itinerary and return a formatted response', async () => {
      const itineraryId = 'itinerary-123'
      const inviteeEmails = ['invitee@example.com']
      const pendingItineraryInvitesResult = [
        {
          id: 'invite-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          itineraryId: itineraryId,
          email: inviteeEmails[0],
        },
      ]
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'User invited successfully.',
        pendingItineraryInvites: pendingItineraryInvitesResult,
      }

      mockItineraryService.inviteToItinerary = jest
        .fn()
        .mockResolvedValue(pendingItineraryInvitesResult)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.inviteToItinerary(
        itineraryId,
        {
          emails: inviteeEmails,
        },
        mockUser
      )

      expect(mockItineraryService.inviteToItinerary).toHaveBeenCalledWith(
        itineraryId,
        inviteeEmails,
        mockUser.id
      )

      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if the itinerary does not exist', async () => {
      const itineraryId = 'non-existent-id'
      const inviteeEmails = ['invitee@example.com']
      const mockError = new NotFoundException(
        `Itinerary with ID ${itineraryId} not found`
      )

      mockItineraryService.inviteToItinerary = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.inviteToItinerary(
          itineraryId,
          {
            emails: inviteeEmails,
          },
          mockUser
        )
      ).rejects.toThrow(mockError)
      expect(mockItineraryService.inviteToItinerary).toHaveBeenCalledWith(
        itineraryId,
        inviteeEmails,
        mockUser.id
      )
    })

    it('should throw ForbiddenException if the user is not authorized to invite', async () => {
      const itineraryId = 'itinerary-123'
      const inviteeEmails = ['invitee@example.com']

      mockItineraryService.inviteToItinerary = jest
        .fn()
        .mockRejectedValue(
          new ForbiddenException(
            'Not authorized to invite users to this itinerary'
          )
        )

      // Act & Assert
      await expect(
        controller.inviteToItinerary(
          itineraryId,
          { emails: inviteeEmails },
          mockUser
        )
      ).rejects.toThrow(ForbiddenException)
      expect(mockItineraryService.inviteToItinerary).toHaveBeenCalledWith(
        itineraryId,
        inviteeEmails,
        mockUser.id
      )
    })
  })

  describe('acceptItineraryInvitation', () => {
    it('should accept an itinerary invitation', async () => {
      const pendingItineraryInviteId = 'pending-invite-123'
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Invitation accepted successfully.',
      }

      mockItineraryService.acceptItineraryInvitation = jest
        .fn()
        .mockResolvedValue(undefined)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.acceptItineraryInvitation(
        pendingItineraryInviteId,
        mockUser
      )

      expect(
        mockItineraryService.acceptItineraryInvitation
      ).toHaveBeenCalledWith(pendingItineraryInviteId, mockUser)
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if the invitation does not exist', async () => {
      const itineraryId = 'non-existent-id'
      const mockError = new NotFoundException(
        `Invitation for itinerary with ID ${itineraryId} not found`
      )

      mockItineraryService.acceptItineraryInvitation = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.acceptItineraryInvitation(itineraryId, mockUser)
      ).rejects.toThrow(mockError)

      expect(
        mockItineraryService.acceptItineraryInvitation
      ).toHaveBeenCalledWith(itineraryId, mockUser)
    })

    it('should throw ForbiddenException if the user is not authorized to accept the invitation', async () => {
      const itineraryId = 'itinerary-123'

      mockItineraryService.acceptItineraryInvitation = jest
        .fn()
        .mockRejectedValue(
          new ForbiddenException('Not authorized to accept this invitation')
        )

      await expect(
        controller.acceptItineraryInvitation(itineraryId, mockUser)
      ).rejects.toThrow(ForbiddenException)

      expect(
        mockItineraryService.acceptItineraryInvitation
      ).toHaveBeenCalledWith(itineraryId, mockUser)
    })
  })

  describe('removeUserFromItinerary', () => {
    it('should remove a user from an itinerary and return a formatted response', async () => {
      const itineraryId = 'itinerary-123'
      const userId = 'user-456'
      const deletedParticipant = {
        id: `itinerary-access-id`,
        itineraryId,
        userId,
      }
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'User removed from itinerary successfully.',
        deletedParticipant,
      }

      mockItineraryService.removeUserFromItinerary = jest
        .fn()
        .mockResolvedValue(deletedParticipant)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.removeUserFromItinerary(
        itineraryId,
        userId,
        mockUser
      )

      expect(mockItineraryService.removeUserFromItinerary).toHaveBeenCalledWith(
        itineraryId,
        userId,
        mockUser
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if the itinerary does not exist', async () => {
      const itineraryId = 'non-existent-id'
      const userId = 'user-456'
      const mockError = new NotFoundException(
        `Itinerary with ID ${itineraryId} not found`
      )

      mockItineraryService.removeUserFromItinerary = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.removeUserFromItinerary(itineraryId, userId, mockUser)
      ).rejects.toThrow(mockError)

      expect(mockItineraryService.removeUserFromItinerary).toHaveBeenCalledWith(
        itineraryId,
        userId,
        mockUser
      )
    })

    it('should throw NotFoundException if the user to be removed does not exist', async () => {
      const itineraryId = 'itinerary-123'
      const userId = 'non-existent-user'
      const mockError = new NotFoundException(
        `User with ID ${userId} not found in itinerary ${itineraryId}`
      )

      mockItineraryService.removeUserFromItinerary = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.removeUserFromItinerary(itineraryId, userId, mockUser)
      ).rejects.toThrow(mockError)
    })

    it('should throw ForbiddenException if the user is not authorized to remove participants', async () => {
      const itineraryId = 'itinerary-123'
      const userId = 'user-456'
      const mockError = new ForbiddenException(
        'Not authorized to remove users from this itinerary'
      )

      mockItineraryService.removeUserFromItinerary = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.removeUserFromItinerary(itineraryId, userId, mockUser)
      ).rejects.toThrow(mockError)
    })
  })

  describe('findContingencies', () => {
    it('should return contingency plans for an itinerary', async () => {
      const itineraryId = 'itinerary-123'
      const mockContingencies = [
        {
          id: 'contingency-1',
          title: 'Plan B',
          description: 'Alternative plan if weather is bad',
        },
        {
          id: 'contingency-2',
          title: 'Plan C',
          description: 'Alternative plan if flights are cancelled',
        },
      ]

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Contingencies fetched successfully.',
        contingencies: mockContingencies,
      }

      mockItineraryService.findContingencyPlans = jest
        .fn()
        .mockResolvedValue(mockContingencies)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findContingencies(itineraryId, mockUser)

      expect(mockItineraryService.findContingencyPlans).toHaveBeenCalledWith(
        itineraryId,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Contingencies fetched successfully.',
        },
        { contingencies: mockContingencies }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if itinerary not found', async () => {
      const itineraryId = 'non-existent-id'
      const mockError = new NotFoundException(
        `Itinerary with ID ${itineraryId} not found`
      )

      mockItineraryService.findContingencyPlans = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.findContingencies(itineraryId, mockUser)
      ).rejects.toThrow(NotFoundException)
      expect(mockItineraryService.findContingencyPlans).toHaveBeenCalledWith(
        itineraryId,
        mockUser
      )
    })

    it('should throw ForbiddenException if user is not authorized', async () => {
      const itineraryId = 'itinerary-123'
      const mockError = new ForbiddenException(
        'Not authorized to access this itinerary'
      )

      mockItineraryService.findContingencyPlans = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.findContingencies(itineraryId, mockUser)
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('findContingencyById', () => {
    it('should return a specific contingency plan', async () => {
      const itineraryId = 'itinerary-123'
      const contingencyId = 'contingency-1'
      const mockContingency = {
        id: contingencyId,
        title: 'Plan B',
        description: 'Alternative plan if weather is bad',
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Contingency fetched successfully.',
        contingency: mockContingency,
      }

      mockItineraryService.findContingencyPlan = jest
        .fn()
        .mockResolvedValue(mockContingency)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findContingencyById(
        itineraryId,
        contingencyId,
        mockUser
      )

      expect(mockItineraryService.findContingencyPlan).toHaveBeenCalledWith(
        itineraryId,
        contingencyId,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Contingency fetched successfully.',
        },
        { contingency: mockContingency }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if contingency plan not found', async () => {
      const itineraryId = 'itinerary-123'
      const contingencyId = 'non-existent-id'
      const mockError = new NotFoundException(
        `Contingency with ID ${contingencyId} not found in itinerary ${itineraryId}`
      )

      mockItineraryService.findContingencyPlan = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.findContingencyById(itineraryId, contingencyId, mockUser)
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('createContingency', () => {
    it('should create a contingency plan and return a formatted response', async () => {
      const itineraryId = 'itinerary-123'
      const createContingencyPlanDto: CreateItineraryDto = {
        title: 'Bad Weather Plan',
        description: 'What to do if it rains',
        startDate: undefined,
        endDate: undefined,
        sections: [],
      }

      const mockCreatedContingency = {
        id: 'contingency-new',
        itineraryId,
        title: createContingencyPlanDto.title,
        description: createContingencyPlanDto.description,
        isSelected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Contingency created successfully.',
        contingency: mockCreatedContingency,
      }

      mockItineraryService.createContingencyPlan = jest
        .fn()
        .mockResolvedValue(mockCreatedContingency)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.createContingency(
        itineraryId,
        mockUser,
        createContingencyPlanDto
      )

      expect(mockItineraryService.createContingencyPlan).toHaveBeenCalledWith(
        itineraryId,
        createContingencyPlanDto,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Contingency created successfully.',
        },
        { contingency: mockCreatedContingency }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if itinerary not found', async () => {
      const itineraryId = 'non-existent-id'
      const createContingencyPlanDto: CreateItineraryDto = {
        title: 'Bad Weather Plan',
        description: 'What to do if it rains',
        startDate: undefined,
        endDate: undefined,
        sections: [],
      }

      const mockError = new NotFoundException(
        `Itinerary with ID ${itineraryId} not found`
      )

      mockItineraryService.createContingencyPlan = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.createContingency(
          itineraryId,
          mockUser,
          createContingencyPlanDto
        )
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('selectContingency', () => {
    it('should select a contingency plan and return a formatted response', async () => {
      const itineraryId = 'itinerary-123'
      const contingencyId = 'contingency-1'

      const mockSelectedContingency = {
        id: contingencyId,
        itineraryId,
        title: 'Plan B',
        description: 'Alternative plan if weather is bad',
        isSelected: true,
        updatedAt: new Date(),
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Contingency selected successfully.',
        contingency: mockSelectedContingency,
      }

      mockItineraryService.selectContingencyPlan = jest
        .fn()
        .mockResolvedValue(mockSelectedContingency)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.selectContingency(
        itineraryId,
        contingencyId,
        mockUser
      )

      expect(mockItineraryService.selectContingencyPlan).toHaveBeenCalledWith(
        itineraryId,
        contingencyId,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Contingency selected successfully.',
        },
        { contingency: mockSelectedContingency }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if contingency not found', async () => {
      const itineraryId = 'itinerary-123'
      const contingencyId = 'non-existent-id'

      const mockError = new NotFoundException(
        `Contingency with ID ${contingencyId} not found in itinerary ${itineraryId}`
      )

      mockItineraryService.selectContingencyPlan = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.selectContingency(itineraryId, contingencyId, mockUser)
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateContingency', () => {
    it('should update a contingency plan and return a formatted response', async () => {
      const itineraryId = 'itinerary-123'
      const contingencyId = 'contingency-1'
      const updateContingencyPlanDto: CreateItineraryDto = {
        title: 'Updated Plan B',
        description: 'Updated alternative plan for bad weather',
        startDate: undefined,
        endDate: undefined,
        sections: [],
      }

      const mockUpdatedContingency = {
        id: contingencyId,
        itineraryId,
        title: updateContingencyPlanDto.title,
        description: updateContingencyPlanDto.description,
        isSelected: false,
        updatedAt: new Date(),
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Contingency updated successfully.',
        contingency: mockUpdatedContingency,
      }

      mockItineraryService.updateContingencyPlan = jest
        .fn()
        .mockResolvedValue(mockUpdatedContingency)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.updateContingency(
        itineraryId,
        contingencyId,
        mockUser,
        updateContingencyPlanDto
      )

      expect(mockItineraryService.updateContingencyPlan).toHaveBeenCalledWith(
        itineraryId,
        contingencyId,
        updateContingencyPlanDto,
        mockUser
      )
      expect(mockResponseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Contingency updated successfully.',
        },
        { contingency: mockUpdatedContingency }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw NotFoundException if contingency not found', async () => {
      const itineraryId = 'itinerary-123'
      const contingencyId = 'non-existent-id'
      const updateContingencyPlanDto: CreateItineraryDto = {
        title: 'Updated Plan',
        description: 'Updated description',
        startDate: undefined,
        endDate: undefined,
        sections: [],
      }

      const mockError = new NotFoundException(
        `Contingency with ID ${contingencyId} not found in itinerary ${itineraryId}`
      )

      mockItineraryService.updateContingencyPlan = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.updateContingency(
          itineraryId,
          contingencyId,
          mockUser,
          updateContingencyPlanDto
        )
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException if user is not authorized', async () => {
      const itineraryId = 'itinerary-123'
      const contingencyId = 'contingency-1'
      const updateContingencyPlanDto: CreateItineraryDto = {
        title: 'Updated Plan',
        description: 'Updated description',
        startDate: undefined,
        endDate: undefined,
        sections: [],
      }

      const mockError = new ForbiddenException(
        'Not authorized to update contingency plans for this itinerary'
      )

      mockItineraryService.updateContingencyPlan = jest
        .fn()
        .mockRejectedValue(mockError)

      await expect(
        controller.updateContingency(
          itineraryId,
          contingencyId,
          mockUser,
          updateContingencyPlanDto
        )
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('searchItineraries', () => {
    it('should search itineraries with default parameters', async () => {
      // Mock search results
      const mockSearchResults = {
        data: [
          { id: 'itinerary-1', title: 'Trip to Japan' },
          { id: 'itinerary-2', title: 'Beach Vacation' },
        ],
        metadata: {
          total: 2,
          page: 1,
          totalPages: 1,
        },
      }

      mockItineraryService.searchItineraries.mockResolvedValue(
        mockSearchResults
      )

      // Call controller method with no parameters
      const result = await controller.searchItineraries()

      // Verify service was called with correct parameters
      expect(mockItineraryService.searchItineraries).toHaveBeenCalledWith(
        '', // empty query
        1, // default page
        undefined, // default limit
        undefined, // no filters
        'startDate', // default sort
        'asc' // default order
      )

      // Verify correct result was returned
      expect(result).toEqual(mockSearchResults)
    })

    it('should search itineraries with query and page parameters', async () => {
      // Mock search results
      const mockSearchResults = {
        data: [{ id: 'itinerary-3', title: 'Mountain Trek' }],
        metadata: {
          total: 1,
          page: 2,
          totalPages: 1,
        },
      }

      mockItineraryService.searchItineraries.mockResolvedValue(
        mockSearchResults
      )

      // Call controller method with query and page
      const result = await controller.searchItineraries('mountain', 2)

      // Verify service was called with correct parameters
      expect(mockItineraryService.searchItineraries).toHaveBeenCalledWith(
        'mountain', // query
        2, // page
        undefined, // default limit
        undefined, // no filters
        'startDate', // default sort
        'asc' // default order
      )

      // Verify correct result was returned
      expect(result).toEqual(mockSearchResults)
    })

    it('should search itineraries with tags filter', async () => {
      // Mock search results
      const mockSearchResults = {
        data: [
          { id: 'itinerary-4', title: 'Beach Trip', tags: ['tag-1', 'tag-2'] },
        ],
        metadata: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      }

      mockItineraryService.searchItineraries.mockResolvedValue(
        mockSearchResults
      )

      // Call controller method with tags
      const result = await controller.searchItineraries(
        'beach',
        1,
        'tag-1,tag-2'
      )

      // Verify service was called with correct filter string
      expect(mockItineraryService.searchItineraries).toHaveBeenCalledWith(
        'beach',
        1,
        undefined,
        'tags.tag.id IN ["tag-1", "tag-2"]',
        'startDate', // default sort
        'asc' // default order
      )

      // Verify correct result was returned
      expect(result).toEqual(mockSearchResults)
    })

    it('should search itineraries with date range filters', async () => {
      // Mock search results
      const mockSearchResults = {
        data: [
          {
            id: 'itinerary-5',
            title: 'Summer Trip',
            startDate: '2025-06-01T00:00:00.000Z',
            endDate: '2025-06-15T00:00:00.000Z',
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      }

      mockItineraryService.searchItineraries.mockResolvedValue(
        mockSearchResults
      )

      // Create dates for testing
      const startDate = new Date('2025-06-01')
      const endDate = new Date('2025-06-15')

      // Call controller method with date filters
      const result = await controller.searchItineraries(
        'summer',
        1,
        undefined,
        startDate.toISOString(),
        endDate.toISOString()
      )

      // Construct expected filter string
      const expectedFilter = `startDate >= "${startDate.toISOString()}" AND endDate <= "${endDate.toISOString()}"`

      // Verify service was called with correct filters
      expect(mockItineraryService.searchItineraries).toHaveBeenCalledWith(
        'summer',
        1,
        undefined,
        expectedFilter,
        'startDate', // default sort
        'asc' // default order
      )

      // Verify correct result was returned
      expect(result).toEqual(mockSearchResults)
    })

    it('should search itineraries with day count range filters', async () => {
      // Mock search results
      const mockSearchResults = {
        data: [
          {
            id: 'itinerary-7',
            title: 'Weekend Getaway',
            daysCount: 2,
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      }

      mockItineraryService.searchItineraries.mockResolvedValue(
        mockSearchResults
      )

      // Call controller method with day count filters
      const result = await controller.searchItineraries(
        'weekend',
        1,
        undefined,
        undefined,
        undefined,
        '2', // minDaysCount
        '3' // maxDaysCount
      )

      // Construct expected filter string
      const expectedFilter = `daysCount >= 2 AND daysCount <= 3`

      // Verify service was called with correct filters
      expect(mockItineraryService.searchItineraries).toHaveBeenCalledWith(
        'weekend',
        1,
        undefined,
        expectedFilter,
        'startDate', // default sort
        'asc' // default order
      )

      // Verify correct result was returned
      expect(result).toEqual(mockSearchResults)
    })

    it('should search itineraries with combined filters and custom sorting', async () => {
      // Mock search results
      const mockSearchResults = {
        data: [
          {
            id: 'itinerary-6',
            title: 'Beach Summer Vacation',
            tags: ['tag-3'],
            startDate: '2025-07-01T00:00:00.000Z',
            endDate: '2025-07-15T00:00:00.000Z',
            daysCount: 14,
            likes: 42,
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      }

      mockItineraryService.searchItineraries.mockResolvedValue(
        mockSearchResults
      )

      // Create dates for testing
      const startDate = new Date('2025-07-01')
      const endDate = new Date('2025-07-15')

      // Call controller method with all filters and custom sorting
      const result = await controller.searchItineraries(
        'vacation',
        1,
        'tag-3',
        startDate.toISOString(),
        endDate.toISOString(),
        '7', // minDaysCount
        '14', // maxDaysCount
        'likes', // sortBy
        'desc' // order
      )

      // Construct expected filter string
      const expectedFilter = `tags.tag.id IN ["tag-3"] AND startDate >= "${startDate.toISOString()}" AND endDate <= "${endDate.toISOString()}" AND daysCount >= 7 AND daysCount <= 14`

      // Verify service was called with correct parameters
      expect(mockItineraryService.searchItineraries).toHaveBeenCalledWith(
        'vacation',
        1,
        undefined,
        expectedFilter,
        'likes', // custom sort field
        'desc' // custom order
      )

      // Verify correct result was returned
      expect(result).toEqual(mockSearchResults)
    })

    it('should handle errors from the search service', async () => {
      // Mock error from service
      const mockError = new Error('Search engine unavailable')
      mockItineraryService.searchItineraries.mockRejectedValue(mockError)

      // Test that error is propagated
      await expect(controller.searchItineraries('query')).rejects.toThrow(
        mockError
      )

      // Verify service was called
      expect(mockItineraryService.searchItineraries).toHaveBeenCalled()
    })
  })

  describe('createViewItinerary', () => {
    it('should call service and return response', async () => {
      const user = { id: 'user123' }
      const itineraryId = 'itinerary123'
      const createdView = { id: 'view1', itineraryId, userId: user.id }

      mockItineraryService.createViewItinerary.mockResolvedValue(createdView)
      mockResponseUtil.response.mockReturnValue({
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary view added successfully',
        data: createdView,
      })

      const result = await controller.createViewItinerary(
        user as any,
        itineraryId
      )

      expect(itineraryService.createViewItinerary).toHaveBeenCalledWith(
        itineraryId,
        user
      )
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Itinerary view added successfully',
        },
        {
          itinerary: createdView,
        }
      )
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary view added successfully',
        data: createdView,
      })
    })
  })

  describe('getViewItinerary', () => {
    it('should call service and return viewed itineraries', async () => {
      const user = { id: 'user123' }
      const itinerary = [{ itineraryId: 'a' }, { itineraryId: 'b' }]

      mockItineraryService.getViewItinerary.mockResolvedValue(itinerary)
      mockResponseUtil.response.mockReturnValue({
        statusCode: HttpStatus.OK,
        message: 'Itinerary views fetched successfully',
        itinerary,
      })

      const result = await controller.getViewItinerary(user as any)

      expect(itineraryService.getViewItinerary).toHaveBeenCalledWith(user)
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itinerary views fetched successfully',
        },
        {
          itinerary,
        }
      )
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itinerary views fetched successfully',
        itinerary,
      })
    })
  })
})
