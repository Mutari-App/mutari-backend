import { Test, TestingModule } from '@nestjs/testing'
import { StaticController } from './static.controller'
import { StaticService } from './static.service'

describe('StaticController', () => {
  let controller: StaticController
  let staticService: StaticService

  beforeEach(async () => {
    const mockStaticService = {
      searchCountries: jest.fn().mockResolvedValue(['Indonesia', 'India']),
      getCountryCode: jest.fn().mockResolvedValue('ID'),
      searchCities: jest.fn().mockResolvedValue(['Jakarta', 'Surabaya']),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaticController],
      providers: [
        {
          provide: StaticService,
          useValue: mockStaticService,
        },
      ],
    }).compile()

    controller = module.get<StaticController>(StaticController)
    staticService = module.get<StaticService>(StaticService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('getCountries', () => {
    it('should return list of countries', async () => {
      const query = 'Ind'
      const result = await controller.getCountries(query)

      expect(staticService.searchCountries).toHaveBeenCalledWith(query)
      expect(result).toEqual(['Indonesia', 'India'])
    })
  })

  describe('getCountryCode', () => {
    it('should return country code', async () => {
      const placeId = '123'
      const result = await controller.getCountryCode(placeId)

      expect(staticService.getCountryCode).toHaveBeenCalledWith(placeId)
      expect(result).toBe('ID')
    })
  })

  describe('getCities', () => {
    it('should return list of cities', async () => {
      const placeId = 'ID'
      const query = 'Ja'
      const result = await controller.getCities(placeId, query)

      expect(staticService.searchCities).toHaveBeenCalledWith(query, placeId)
      expect(result).toEqual(['Jakarta', 'Surabaya'])
    })
  })
})
