import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'

describe('ItineraryController', () => {
  let controller: ItineraryController
  let service: ItineraryService

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
      ],
    }).compile()

    controller = module.get<ItineraryController>(ItineraryController)
    service = module.get<ItineraryService>(ItineraryService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('removeItinerary', () => {
    it('should call remove() in the service and delete an itinerary', async () => {
      const itineraryId = 'ITN123'
      jest.spyOn(service, 'removeItinerary').mockResolvedValue(undefined)

      await controller.removeItinerary(itineraryId)
      expect(service.removeItinerary).toHaveBeenCalledWith(itineraryId)
    })
    it('should throw an error if itinerary is not found', async () => {
      const itineraryId = 'non-existent-id'
      jest
        .spyOn(service, 'removeItinerary')
        .mockRejectedValue(new Error('Not Found'))

      await expect(controller.removeItinerary(itineraryId)).rejects.toThrow(
        'Not Found'
      )
      expect(service.removeItinerary).toHaveBeenCalledWith(itineraryId)
    })
  })
})
