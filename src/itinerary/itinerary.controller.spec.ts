import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import { User } from '@prisma/client'

describe('ItineraryController', () => {
  let controller: ItineraryController
  let service: ItineraryService
  let responseUtil: ResponseUtil

  const mockItineraryService = {
    findMyItineraries: jest.fn(),
    markAsComplete: jest.fn(),
    findMyCompletedItineraries: jest.fn(),
  }
  const mockResponseUtil = {
    response: jest.fn(),
  }

  const mockUser: User = {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
    phoneNumber: '08123456789',
    password: 'hashedpassword',
    photoProfile: 'profile.jpg',
    referralCode: 'REF123',
    isEmailConfirmed: true,
    referredById: null,
    loyaltyPoints: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    service = module.get<ItineraryService>(ItineraryService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
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

      expect(service.markAsComplete).toHaveBeenCalledWith('1', 'user1')
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
      const result = await controller.findMyCompletedItineraries(mockUser)

      // Expected response
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: mockItineraries,
      })

      // Ensure service method called correctly
      expect(service.findMyCompletedItineraries).toHaveBeenCalledWith('user-1')

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

      const result = await controller.findMyCompletedItineraries(mockUser)

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
        itinerary: [],
      })

      expect(service.findMyCompletedItineraries).toHaveBeenCalledWith('user-2')
    })
  })
})
