import { Test, TestingModule } from '@nestjs/testing'
import { TourController } from './tour.controller'
import { TourService } from './tour.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus } from '@nestjs/common'
import { DURATION_TYPE } from '@prisma/client'

describe('TourController', () => {
  let controller: TourController
  let service: TourService
  let responseUtil: ResponseUtil

  const mockResponseUtil = {
    response: jest.fn(),
  }

  const mockTour = {
    id: 'tour123',
    title: 'Mount Bromo Tour',
    maxCapacity: 10,
    description: 'A tour to Mount Bromo',
    location: 'East Java',
    pricePerTicket: 100,
    duration: 3,
    DURATION_TYPE: DURATION_TYPE.DAY,
    itineraryId: 'itinerary456',
    itinerary: {
      id: '123',
      sections: [],
    },
  }

  const mockTourService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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
    service = module.get<TourService>(TourService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findOne', () => {
    it('should return a successful response with tour data', async () => {
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Tour fetched successfully.',
        data: mockTour,
      }

      mockTourService.findOne.mockResolvedValue(mockTour)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findOne('tour123')

      expect(service.findOne).toHaveBeenCalledWith('tour123')
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Tour fetched successfully.',
        },
        { data: mockTour }
      )
      expect(result).toBe(mockResponse)
    })
  })
})
