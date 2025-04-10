import { Test, TestingModule } from '@nestjs/testing'
import { MapService } from './map.service'
import { HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import axios from 'axios'

jest.mock('axios')

describe('MapService', () => {
  let service: MapService
  let prisma: PrismaService

  beforeEach(async () => {
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapService,
        {
          provide: PrismaService,
          useValue: {
            block: {
              aggregate: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<MapService>(MapService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getPlaceDetails', () => {
    it('should throw an error if placeId is not provided', async () => {
      await expect(service.getPlaceDetails('')).rejects.toThrow(
        new HttpException('Place ID is required', HttpStatus.BAD_REQUEST)
      )
    })

    it('should throw an error when API call fails', async () => {
      jest.spyOn(service, 'getPriceRangeByPlaceId').mockResolvedValue({
        startPrice: 50000,
        endPrice: 100000,
      })
      ;(axios.get as jest.Mock).mockRejectedValue(new Error('API Error'))

      await expect(service.getPlaceDetails('testPlaceId')).rejects.toThrow(
        new HttpException(
          'Failed to fetch data',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      )

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

    it('should return place details with price range when successful', async () => {
      const mockPlaceDetailsResponse = {
        data: {
          result: {
            name: 'Test Place',
            vicinity: 'Test Location',
            rating: 4.5,
            user_ratings_total: 100,
          },
        },
      }

      const mockPriceRange = {
        startPrice: 50000,
        endPrice: 100000,
      }

      ;(axios.get as jest.Mock).mockResolvedValueOnce(mockPlaceDetailsResponse)

      jest
        .spyOn(service, 'getPriceRangeByPlaceId')
        .mockResolvedValue(mockPriceRange)

      const result = await service.getPlaceDetails('testPlaceId')

      expect(result).toEqual({
        ...mockPlaceDetailsResponse.data,
        result: {
          ...mockPlaceDetailsResponse.data.result,
          priceRange: mockPriceRange,
        },
      })

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
  })

  describe('getPriceRangeByPlaceId', () => {
    it('should throw an error if placeId is not provided', async () => {
      await expect(service.getPriceRangeByPlaceId('')).rejects.toThrow(
        new HttpException('Place ID is required', HttpStatus.BAD_REQUEST)
      )
    })

    it('should return price range when API call is successful', async () => {
      const mockPlacesResponse = {
        data: {
          priceRange: {
            startPrice: { units: '50000' },
            endPrice: { units: '100000' },
          },
        },
      }

      ;(axios.get as jest.Mock).mockResolvedValue(mockPlacesResponse)

      const result = await service.getPriceRangeByPlaceId('testPlaceId')

      expect(result).toEqual({
        startPrice: 50000,
        endPrice: 100000,
      })

      expect(axios.get).toHaveBeenCalledWith(
        'https://places.googleapis.com/v1/places/testPlaceId',
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': 'test-api-key',
            'X-Goog-FieldMask': 'priceRange',
          },
        }
      )
    })

    it('should handle missing price range data', async () => {
      const mockPlacesResponse = {
        data: {},
      }

      ;(axios.get as jest.Mock).mockResolvedValue(mockPlacesResponse)

      const result = await service.getPriceRangeByPlaceId('testPlaceId')

      expect(result).toEqual({
        startPrice: NaN,
        endPrice: NaN,
      })
    })

    it('should throw an error when API call fails', async () => {
      ;(axios.get as jest.Mock).mockRejectedValue(new Error('API Error'))

      await expect(
        service.getPriceRangeByPlaceId('testPlaceId')
      ).rejects.toThrow(
        new HttpException(
          'Failed to fetch data',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      )
    })
  })
})
