import { Controller, Get, Param, Query } from '@nestjs/common'
import { StaticService } from './static.service'

@Controller('static')
export class StaticController {
  constructor(private readonly staticService: StaticService) {}

  // Endpoint untuk mendapatkan semua negara
  @Get('countries')
  async getCountries(@Query('query') query: string) {
    return this.staticService.searchCountries(query)
  }
  @Get('countries/:placeId')
  async getCountryCode(@Param('placeId') placeId: string) {
    return this.staticService.getCountryCode(placeId)
  }

  // Endpoint untuk mendapatkan kota berdasarkan countryId
  @Get('cities/:countryCode')
  async getCities(
    @Param('countryCode') countryCode: string,
    @Query('query') query: string
  ) {
    return this.staticService.searchCities(query, countryCode)
  }
}
