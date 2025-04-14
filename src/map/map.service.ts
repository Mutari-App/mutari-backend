import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class MapService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

  async getPlaceDetails(placeId: string) {
    if (!placeId) {
      throw new HttpException('Place ID is required', HttpStatus.BAD_REQUEST)
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json`
    const priceRange = await this.getPriceRangeByPlaceId(placeId)

    try {
      const response = await axios.get(url, {
        params: {
          placeid: placeId,
          fields:
            'name,photos,international_phone_number,vicinity,rating,user_ratings_total,website',
          key: this.googleMapsApiKey,
        },
      })
      return {
        ...response.data,
        result: { ...response.data.result, priceRange },
      }
    } catch (_) {
      throw new HttpException(
        'Failed to fetch data',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  async getPriceRangeByPlaceId(placeId: string) {
    if (!placeId) {
      throw new HttpException('Place ID is required', HttpStatus.BAD_REQUEST)
    }

    const url = `https://places.googleapis.com/v1/places/${placeId}`

    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.googleMapsApiKey,
          'X-Goog-FieldMask': 'priceRange',
        },
      })
      const priceRange = {
        startPrice: Number(response.data.priceRange?.startPrice?.units),
        endPrice: Number(response.data.priceRange?.endPrice?.units),
      }
      return priceRange
    } catch (_) {
      throw new HttpException(
        'Failed to fetch data',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
