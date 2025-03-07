import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus } from '@nestjs/common'

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
            removeItinerary: jest.fn(),
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

  describe('removeItinerary', () => {
    it('should call remove() in the service and delete an itinerary', async () => {
      const itineraryId = 'ITN123'
      jest.spyOn(service, 'removeItinerary').mockResolvedValue(undefined)

      const responseMock = {
        statusCode: HttpStatus.OK,
        message: 'Itinerary deleted successfully.',
      }

      jest.spyOn(responseUtil, 'response').mockReturnValue(responseMock)

      const result = await controller.removeItinerary(itineraryId)

      expect(service.removeItinerary).toHaveBeenCalledWith(itineraryId)
      expect(responseUtil.response).toHaveBeenCalledWith(responseMock, null)
      expect(result).toEqual(responseMock)
    })
    it('should throw an error if itinerary is not found', async () => {
      const itineraryId = 'non-existent-id'
      const error = new Error('Not Found')

      jest.spyOn(service, 'removeItinerary').mockRejectedValue(error)

      await expect(controller.removeItinerary(itineraryId)).rejects.toThrow(
        'Not Found'
      )

      expect(service.removeItinerary).toHaveBeenCalledWith(itineraryId)
    })
  })
})
