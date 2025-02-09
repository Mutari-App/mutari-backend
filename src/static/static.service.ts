import { Injectable, HttpStatus } from '@nestjs/common'
import axios from 'axios'
import { ResponseUtil } from 'src/common/utils/response.util'

@Injectable()
export class StaticService {
  private readonly googleApiKey = process.env.GOOGLE_API_KEY // Simpan API Key di .env

  constructor(private readonly responseUtil: ResponseUtil) {}

  async searchCountries(query: string) {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&types=country&key=${this.googleApiKey}`
    const response = await axios.get(url)

    const countries = response.data.predictions.map((place) => ({
      id: place.place_id,
      name: place.description,
    }))

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Country search results retrieved successfully.',
      },
      { countries }
    )
  }

  async searchCities(query: string, countryCode: string) {
    console.log(`Searching for cities in country: ${countryCode}`)

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&types=(cities)&components=country:${countryCode}&key=${this.googleApiKey}`
    const response = await axios.get(url)

    const cities = response.data.predictions.map((city) => ({
      name: city.description,
      id: city.place_id,
    }))

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'City search results retrieved successfully.',
      },
      { cities }
    )
  }

  async getCountryCode(placeId: string) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components&key=${this.googleApiKey}`
    const response = await axios.get(url)

    const countryComponent = response.data.result.address_components.find(
      (component) => component.types.includes('country')
    )

    const country = {
      name: countryComponent.long_name, // Nama negara
      code: countryComponent.short_name, // Kode negara (ID, US, MY, dll.)
    }

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Country code retrieved successfully.',
      },
      { country }
    )
  }
}
