import { Test, TestingModule } from '@nestjs/testing'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus, NotFoundException } from '@nestjs/common'

describe('ProfileController', () => {
  let controller: ProfileController

  const mockProfileService = {
    findOne: jest.fn(),
    getListItineraries: jest.fn(),
    getListItineraryLikes: jest.fn(),
    getTransactionHistory: jest.fn(),
  }

  const mockResponseUtil = {
    response: jest.fn((meta, data) => ({ meta, data })),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
        {
          provide: ResponseUtil,
          useValue: mockResponseUtil,
        },
      ],
    }).compile()

    controller = module.get<ProfileController>(ProfileController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findOne', () => {
    it('should return a profile when findOne is called with a valid ID', async () => {
      const id = 'user-123'
      const expectedProfile = {
        id,
        updatedAt: new Date(),
        createdAt: new Date(),
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '081234123412',
        photoProfile: 'profile.png',
        referralCode: 'ABCD1234',
        isEmailConfirmed: true,
        referredById: 'referred-user-123',
        loyaltyPoints: 1000,
        birthDate: new Date(),
      }

      mockProfileService.findOne.mockResolvedValue(expectedProfile)

      const result = await controller.findOne(id)

      expect(result).toEqual({
        meta: {
          message: 'Profile retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          profile: expectedProfile,
        },
      })
      expect(mockProfileService.findOne).toHaveBeenCalledWith(id)
    })
  })

  describe('getListItineraries', () => {
    it('should return itineraries when getListItineraries is called with a valid ID', async () => {
      const id = 'user-123'
      const expectedItineraries = [
        {
          id: 'itinerary-1',
          title: 'Trip to Paris',
          description: 'Exploring Paris',
          createdAt: new Date(),
        },
        {
          id: 'itinerary-2',
          title: 'Tokyo Adventure',
          description: 'Exploring Tokyo',
          createdAt: new Date(),
        },
      ]

      mockProfileService.getListItineraries.mockResolvedValue(
        expectedItineraries
      )

      const result = await controller.getListItineraries(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraries: expectedItineraries,
        },
      })
      expect(mockProfileService.getListItineraries).toHaveBeenCalledWith(id)
    })

    it('should return empty array when user has no itineraries', async () => {
      const id = 'user-123'
      mockProfileService.getListItineraries.mockResolvedValue([])

      const result = await controller.getListItineraries(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraries: [],
        },
      })
    })
  })

  describe('getListItineraryLikes', () => {
    it('should return itinerary likes when getListItineraryLikes is called with a valid ID', async () => {
      const id = 'user-123'
      const expectedLikes = [
        {
          id: 'like-1',
          itineraryId: 'itinerary-1',
          createdAt: new Date(),
        },
        {
          id: 'like-2',
          itineraryId: 'itinerary-2',
          createdAt: new Date(),
        },
      ]

      mockProfileService.getListItineraryLikes.mockResolvedValue(expectedLikes)

      const result = await controller.getListItineraryLikes(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary likes retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraryLikes: expectedLikes,
        },
      })
      expect(mockProfileService.getListItineraryLikes).toHaveBeenCalledWith(id)
    })

    it('should return empty array when user has no itinerary likes', async () => {
      const id = 'user-123'
      mockProfileService.getListItineraryLikes.mockResolvedValue([])

      const result = await controller.getListItineraryLikes(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary likes retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraryLikes: [],
        },
      })
    })
  })
  describe('getTransactionHistory', () => {
    it('should return transaction history when getTransactionHistory is called with a valid ID', async () => {
      // Arrange
      const userId = 'user-123'
      const expectedTransactions = [
        {
          id: 'transaction-1',
          tourId: 'tour-1',
          userId,
          quantity: 2,
          paymentStatus: 'PAID',
          totalPrice: 500000,
          createdAt: new Date(),
          tour: {
            title: 'Bali Adventure',
            location: 'Bali, Indonesia',
          },
          guests: [
            { id: 'guest-1', name: 'John Doe', email: 'john@example.com' },
            { id: 'guest-2', name: 'Jane Doe', email: 'jane@example.com' },
          ],
        },
        {
          id: 'transaction-2',
          tourId: 'tour-2',
          userId,
          quantity: 1,
          paymentStatus: 'PENDING',
          totalPrice: 300000,
          createdAt: new Date(),
          tour: {
            title: 'Jakarta City Tour',
            location: 'Jakarta, Indonesia',
          },
          guests: [
            { id: 'guest-3', name: 'Bob Smith', email: 'bob@example.com' },
          ],
        },
      ]

      mockProfileService.getTransactionHistory.mockResolvedValue(
        expectedTransactions
      )

      // Act
      const result = await controller.getTransactionHistory(userId)

      // Assert
      expect(result).toEqual({
        meta: {
          message: 'Transaction history fetched successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          transactions: expectedTransactions,
        },
      })
      expect(mockProfileService.getTransactionHistory).toHaveBeenCalledWith(
        userId
      )
    })

    it('should return empty array when user has no transactions', async () => {
      // Arrange
      const userId = 'user-123'
      mockProfileService.getTransactionHistory.mockResolvedValue([])

      // Act
      const result = await controller.getTransactionHistory(userId)

      // Assert
      expect(result).toEqual({
        meta: {
          message: 'Transaction history fetched successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          transactions: [],
        },
      })
      expect(mockProfileService.getTransactionHistory).toHaveBeenCalledWith(
        userId
      )
    })

    it('should handle NotFoundException if service throws it', async () => {
      // Arrange
      const userId = 'non-existent-user'
      const errorMessage = 'User not found'
      mockProfileService.getTransactionHistory.mockRejectedValue(
        new NotFoundException(errorMessage)
      )

      // Act and Assert
      await expect(controller.getTransactionHistory(userId)).rejects.toThrow(
        NotFoundException
      )
      expect(mockProfileService.getTransactionHistory).toHaveBeenCalledWith(
        userId
      )
    })
  })
})
