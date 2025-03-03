import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'
import { NotFoundException } from '@nestjs/common'

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
            findOne: jest.fn(),
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

    it('should return an itinerary if found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockItinerary)

      const result = await controller.findOne('ITN123')
      expect(result).toEqual(mockItinerary)
      expect(service.findOne).toHaveBeenCalledWith('ITN123')
    })

    it('should throw NotFoundException if itinerary is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null)

      await expect(controller.findOne('INVALID_ID')).rejects.toThrow(
        new NotFoundException('Itinerary with ID INVALID_ID not found')
      )

      expect(service.findOne).toHaveBeenCalledWith('INVALID_ID')
    })
  })
})
