import { Test, TestingModule } from '@nestjs/testing'
import { StaticService } from './static.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import axios from 'axios'

jest.mock('axios') // Mock Axios agar tidak melakukan request asli

describe('StaticService', () => {
  let service: StaticService
  let responseUtil: ResponseUtil
  let mockAxios: jest.Mocked<typeof axios>

  beforeEach(async () => {
    mockAxios = axios as jest.Mocked<typeof axios>

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaticService,
        {
          provide: ResponseUtil,
          useValue: {
            response: jest.fn((status, data) => ({ status, ...data })),
          },
        },
      ],
    }).compile()

    service = module.get<StaticService>(StaticService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('searchCountries', () => {
    it('should return list of countries', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          predictions: [
            { place_id: 'id1', description: 'Indonesia' },
            { place_id: 'id2', description: 'India' },
          ],
        },
      })

      const result = await service.searchCountries('Ind')

      expect(mockAxios.get).toHaveBeenCalled()
      expect(result).toEqual({
        status: {
          statusCode: 200,
          message: 'Country search results retrieved successfully.',
        },
        countries: [
          { id: 'id1', name: 'Indonesia' },
          { id: 'id2', name: 'India' },
        ],
      })
    })
  })

  describe('searchCities', () => {
    it('should return list of cities based on country', async () => {
      jest.spyOn(service, '_getCountryCode').mockResolvedValue({
        name: 'Indonesia',
        code: 'ID',
      })

      mockAxios.get.mockResolvedValue({
        data: {
          predictions: [
            { place_id: 'city1', description: 'Jakarta' },
            { place_id: 'city2', description: 'Surabaya' },
          ],
        },
      })

      const result = await service.searchCities('Jak', 'some-place-id')

      expect(mockAxios.get).toHaveBeenCalled()
      expect(result).toEqual({
        status: {
          statusCode: 200,
          message: 'City search results retrieved successfully.',
        },
        cities: [
          { id: 'city1', name: 'Jakarta' },
          { id: 'city2', name: 'Surabaya' },
        ],
      })
    })
  })

  describe('_getCountryCode', () => {
    it('should return country details based on placeId', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          result: {
            address_components: [
              { types: ['country'], long_name: 'Indonesia', short_name: 'ID' },
            ],
          },
        },
      })

      const result = await service._getCountryCode('some-place-id')

      expect(mockAxios.get).toHaveBeenCalled()
      expect(result).toEqual({
        name: 'Indonesia',
        code: 'ID',
      })
    })
  })

  describe('getCountryCode', () => {
    it('should return country code response', async () => {
      mockAxios.get.mockResolvedValue({
        data: {
          result: {
            address_components: [
              { types: ['country'], long_name: 'Indonesia', short_name: 'ID' },
            ],
          },
        },
      })

      const result = await service.getCountryCode('some-place-id')

      expect(mockAxios.get).toHaveBeenCalled()
      expect(result).toEqual({
        status: {
          statusCode: 200,
          message: 'Country code retrieved successfully.',
        },
        country: {
          name: 'Indonesia',
          code: 'ID',
        },
      })
    })
  })
})
