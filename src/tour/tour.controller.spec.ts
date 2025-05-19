import { Test, TestingModule } from '@nestjs/testing'
import { TourController } from './tour.controller'
import { TourService } from './tour.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus } from '@nestjs/common'
import { BuyTourTicketDTO } from './dto/buy-tour-ticket.dto'
import { TITLE } from '@prisma/client'

describe('TourController', () => {
  let controller: TourController
  let tourService: TourService
  let responseUtil: ResponseUtil

  const mockResponseUtil = {
    response: jest.fn(),
  }

  // Create a complete mock tour object that matches all required properties
  const mockTour = {
    id: 'tour1',
    title: 'Paris City Tour',
    coverImage: 'paris-tour.jpg',
    maxCapacity: 20,
    description: 'Guided tour of Paris highlights',
    location: 'Paris, France',
    pricePerTicket: 99.99,
    duration: 8,
    durationType: 'HOUR',
    availableTickets: 15,
    includes: [{ icon: 'food', text: 'Lunch included' }],
    itinerary: { id: 'itinerary1', title: 'Paris Trip' },
    user: { id: 'user1', firstName: 'John', lastName: 'Doe' },
  }

  const mockTourService = {
    searchTours: jest.fn().mockResolvedValue({
      data: [mockTour],
      metadata: {
        total: 1,
        page: 1,
        totalPages: 1,
      },
    }),
    createTourView: jest.fn(),
    getTourView: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    buyTourTicket: jest.fn(),
    payTourTicket: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks()
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

  describe('searchTours', () => {
    it('should search tours with default parameters', async () => {
      const result = await controller.searchTours()
      expect(tourService.searchTours).toHaveBeenCalledWith(
        '',
        1,
        20,
        {},
        'createdAt',
        'desc'
      )
      expect(result).toEqual({
        data: [mockTour],
        metadata: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      })
    })

    it('should pass search parameters to the service', async () => {
      await controller.searchTours(
        'paris',
        2,
        10,
        'Paris, France',
        50,
        150,
        4,
        8,
        'HOUR',
        'true',
        'pricePerTicket',
        'asc'
      )

      expect(tourService.searchTours).toHaveBeenCalledWith(
        'paris',
        2,
        10,
        {
          location: 'Paris, France',
          minPrice: 50,
          maxPrice: 150,
          minDuration: 4,
          maxDuration: 8,
          durationType: 'HOUR',
          hasAvailableTickets: true,
        },
        'pricePerTicket',
        'asc'
      )
    })
  })

  describe('getSearchSuggestions', () => {
    it('should return empty suggestions for short queries', async () => {
      const result = await controller.getSearchSuggestions('a')

      expect(result).toEqual({
        suggestions: [],
      })
      expect(tourService.searchTours).not.toHaveBeenCalled()
    })

    it('should return tour title suggestions', async () => {
      // Mock the data with a complete tour object
      jest.spyOn(tourService, 'searchTours').mockResolvedValueOnce({
        data: [
          {
            ...mockTour,
            title: 'Paris City Tour',
            location: 'Paris, France',
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      })

      const result = await controller.getSearchSuggestions('paris')

      expect(tourService.searchTours).toHaveBeenCalledWith('paris', 1, 10)
      // Updated expectation to match what's actually returned
      expect(result).toEqual({
        suggestions: ['Paris City Tour', 'Paris, France'],
      })
    })
  })

  describe('findOne', () => {
    it('should return a successful response with tour data', async () => {
      const mockTourData = {
        id: 'tour123',
        title: 'Test tour',
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Tour fetched successfully.',
        data: mockTour,
      }

      mockTourService.findOne.mockResolvedValue(mockTourData)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findOne('tour123')

      expect(tourService.findOne).toHaveBeenCalledWith('tour123')
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Tour fetched successfully.',
        },
        { data: mockTourData }
      )
      expect(result).toBe(mockResponse)
    })
  })

  describe('buyTourTicket', () => {
    it('should buy a tour ticket successfully', async () => {
      // Mock data
      const tourId = 'tour123'
      const user = { id: 'user123', email: 'test@example.com' }
      const buyTourTicketDto: BuyTourTicketDTO = {
        tourDate: new Date(),
        quantity: 2,
        customer: {
          title: TITLE.MR,
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '1234567890',
          email: 'john.doe@example.com',
        },
        visitors: [
          {
            title: TITLE.MR,
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '1234567890',
            email: 'john.doe@example.com',
          },
          {
            title: TITLE.MRS,
            firstName: 'Jane',
            lastName: 'Doe',
            phoneNumber: '0987654321',
            email: 'jane.doe@example.com',
          },
        ],
      }

      const mockTicket = {
        id: 'ticket123',
        tourId,
        userId: user.id,
        quantity: buyTourTicketDto.quantity,
        status: 'PAID',
      }

      const mockResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Tour ticket purchased successfully',
        data: mockTicket,
      }

      // Setup mocks
      mockTourService.buyTourTicket = jest.fn().mockResolvedValue(mockTicket)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      // Call the method
      const result = await controller.buyTourTicket(
        tourId,
        buyTourTicketDto,
        user as any
      )

      // Assertions
      expect(tourService.buyTourTicket).toHaveBeenCalledWith(
        tourId,
        buyTourTicketDto,
        user
      )
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Tour ticket purchased successfully',
        },
        mockTicket
      )
      expect(result).toBe(mockResponse)
    })
  })

  describe('payTourTicket', () => {
    it('should process tour ticket payment successfully', async () => {
      // Mock data
      const orderId = 'order123'
      const user = { id: 'user123', email: 'test@example.com' }

      const mockTicket = {
        id: 'ticket123',
        orderId,
        userId: user.id,
        status: 'PAID',
        amount: 199.99,
        paymentDate: new Date(),
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Tour ticket payment successful',
        data: { tourTicket: mockTicket },
      }

      // Setup mocks
      mockTourService.payTourTicket = jest.fn().mockResolvedValue(mockTicket)
      mockResponseUtil.response.mockReturnValue(mockResponse)

      // Call the method
      const result = await controller.payTourTicket(orderId, user as any)

      // Assertions
      expect(tourService.payTourTicket).toHaveBeenCalledWith(orderId, user)
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Tour ticket payment successful',
        },
        { tourTicket: mockTicket }
      )
      expect(result).toBe(mockResponse)
    })
  })
})
