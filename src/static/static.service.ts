import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class StaticService {
  private readonly googleApiKey = process.env.GOOGLE_API_KEY // Simpan API Key di .env

  // 🔹 Pencarian Negara
  async searchCountries(query: string) {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&types=country&key=${this.googleApiKey}`
    const response = await axios.get(url)
    console.log(response.data)
    return response.data.predictions.map((place) => ({
      id: place.place_id,
      name: place.description,
    }))
  }

  async searchCities(query: string, countryCode: string) {
    console.log(countryCode)
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&types=(cities)&components=country:${countryCode}&key=${this.googleApiKey}`
    const response = await axios.get(url)
    console.log(response.data)
    return response.data.predictions.map((city) => ({
      name: city.description,
      id: city.place_id,
    }))
  }

  async getCountryCode(placeId: string) {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components&key=${this.googleApiKey}`
    const response = await axios.get(url)
    console.log(response.data)

    const countryComponent = response.data.result.address_components.find(
      (component) => component.types.includes('country')
    )

    return {
      name: countryComponent.long_name, // Nama negara
      code: countryComponent.short_name, // Kode negara (ID, US, MY, dll.)
    }
  }
}
