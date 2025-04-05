import { Test, TestingModule } from '@nestjs/testing'
import { MapService } from './map.service'
import { HttpException, HttpStatus } from '@nestjs/common'
import axios from 'axios'

jest.mock('axios')

describe('MapService', () => {
  let service: MapService

  beforeEach(async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'

    const module: TestingModule = await Test.createTestingModule({
      providers: [MapService],
    }).compile()

    service = module.get<MapService>(MapService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should throw an error if placeId is not provided', async () => {
    await expect(service.getPlaceDetails('')).rejects.toThrow(
      new HttpException('Place ID is required', HttpStatus.BAD_REQUEST)
    )
  })

  it('should return place details when API call is successful', async () => {
    const mockResponse = {
      data: {
        result: {
          name: 'Test Place',
          vicinity: 'Test Location',
          rating: 4.5,
          user_ratings_total: 100,
        },
      },
    }

    ;(axios.get as jest.Mock).mockResolvedValue(mockResponse)

    const result = await service.getPlaceDetails('testPlaceId')
    expect(result).toEqual(mockResponse.data)
    expect(axios.get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          placeid: 'testPlaceId',
          fields:
            'name,photos,international_phone_number,vicinity,rating,user_ratings_total,website',
          key: 'test-api-key',
        },
      }
    )
  })

  it('should throw an error when API call fails', async () => {
    ;(axios.get as jest.Mock).mockRejectedValue(new Error('API Error'))

    await expect(service.getPlaceDetails('testPlaceId')).rejects.toThrow(
      new HttpException(
        'Failed to fetch data',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    )
  })
})
