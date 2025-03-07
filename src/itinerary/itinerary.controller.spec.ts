import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { HttpStatus, NotFoundException } from '@nestjs/common'
import { ResponseUtil } from 'src/common/utils/response.util'
import { BLOCK_TYPE, User } from '@prisma/client'

describe('ItineraryController', () => {
  let controller: ItineraryController
  let service: ItineraryService
  let responseUtil: ResponseUtil

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItineraryController],
      providers: [
        {
          provide: ItineraryService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ResponseUtil,
          useValue: {
            response: jest.fn(),
          },
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

  describe('findOne', () => {
    const mockItinerary = {
      updatedAt: new Date(),
      createdAt: new Date(),
      id: 'INT-123',
      userId: 'USR-123',
      title: 'Trip to Bali',
      description: 'Bali with friends',
      coverImage: null,
      startDate: new Date(),
      endDate: new Date(),
      isPublished: true,
      isCompleted: true,
    }

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

      jest.spyOn(service, 'findOne').mockResolvedValue(mockItinerary)
      jest.spyOn(responseUtil, 'response').mockReturnValue(mockResponse)

      const result = await controller.findOne('ITN-123')

      expect(service.findOne).toHaveBeenCalledWith('ITN-123')
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
      jest.spyOn(service, 'findOne').mockResolvedValue(null)

      await expect(controller.findOne('INVALID_ID')).rejects.toThrow(
        new NotFoundException('Itinerary with ID INVALID_ID not found')
      )
    })
  })
})
