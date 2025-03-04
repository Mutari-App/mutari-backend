/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { BLOCK_TYPE, User } from '@prisma/client'
import { HttpStatus } from '@nestjs/common'

describe('ItineraryController', () => {
  let controller: ItineraryController
  let itineraryService: ItineraryService
  let responseUtil: ResponseUtil

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

  const mockItineraryService = {
    createItinerary: jest.fn(),
    updateItinerary: jest.fn(),
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
})
