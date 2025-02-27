import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryController } from './itinerary.controller'
import { ItineraryService } from './itinerary.service'

describe('ItineraryController', () => {
  let controller: ItineraryController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItineraryController],
      providers: [ItineraryService],
    }).compile()

    controller = module.get<ItineraryController>(ItineraryController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
