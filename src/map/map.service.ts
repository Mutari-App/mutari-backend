import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class MapService {
  private readonly googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

  async getPlaceDetails(placeId: string) {
    if (!placeId) {
      throw new HttpException('Place ID is required', HttpStatus.BAD_REQUEST)
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json`

    try {
      const response = await axios.get(url, {
        params: {
          placeid: placeId,
          fields:
            'name,photos,international_phone_number,vicinity,rating,user_ratings_total,website',
          key: this.googleMapsApiKey,
        },
      })
      return response.data
    } catch (_) {
      throw new HttpException(
        'Failed to fetch data',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
