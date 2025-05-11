import { Test, TestingModule } from '@nestjs/testing'
import { TourController } from './tour.controller'
import { TourService } from './tour.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { User } from '@prisma/client'
import { ResponseUtil } from 'src/common/utils/response.util'
import { ItineraryController } from 'src/itinerary/itinerary.controller'
import { HttpStatus } from '@nestjs/common'

describe('TourController', () => {
  let controller: TourController
  let tourService: TourService
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

  const mockTourService = {
    createTourView: jest.fn(),
    getTourView: jest.fn(),
  }

  const mockResponseUtil = {
    response: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourController],
      providers: [
        {
          provide: TourService,
          useValue: mockTourService,
        },
        {
          provide: ResponseUtil,
          useValue: mockResponseUtil,
        },
      ],
    }).compile()

    controller = module.get<TourController>(TourController)
    tourService = module.get<TourService>(TourService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createTourView', () => {
    it('should call service and return response', async () => {
      const user = { id: 'user123' }
      const tourId = 'tour123'
      const createdView = { id: 'view1', tourId, userId: user.id }

      mockTourService.createTourView.mockResolvedValue(createdView)
      mockResponseUtil.response.mockReturnValue({
        statusCode: HttpStatus.CREATED,
        message: 'Tour view added successfully',
        data: createdView,
      })

      const result = await controller.createTourView(user as any, tourId)

      expect(tourService.createTourView).toHaveBeenCalledWith(tourId, user)
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Tour view added successfully',
        },
        {
          tour: createdView,
        }
      )
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Tour view added successfully',
        data: createdView,
      })
    })
  })

  describe('getTourView', () => {
    it('should call service and return viewed tours', async () => {
      const user = { id: 'user123' }
      const tours = [{ tourId: 'a' }, { tourId: 'b' }]

      mockTourService.getTourView.mockResolvedValue(tours)
      mockResponseUtil.response.mockReturnValue({
        statusCode: HttpStatus.OK,
        message: 'Tour views fetched successfully',
        tours: tours,
      })

      const result = await controller.getTourView(user as any)

      expect(tourService.getTourView).toHaveBeenCalledWith(user)
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Tour views fetched successfully',
        },
        {
          tours: tours,
        }
      )
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Tour views fetched successfully',
        tours: tours,
      })
    })
  })
})
