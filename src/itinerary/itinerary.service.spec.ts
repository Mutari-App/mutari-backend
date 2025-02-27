import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'

describe('ItineraryService', () => {
  let service: ItineraryService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItineraryService],
    }).compile()

    service = module.get<ItineraryService>(ItineraryService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
