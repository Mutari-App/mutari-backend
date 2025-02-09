import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common'
import { StaticService } from './static.service'

@Controller('static')
export class StaticController {
  constructor(private readonly staticService: StaticService) {}

  @HttpCode(HttpStatus.OK)
  @Get('countries')
  async getCountries(@Query('query') query: string) {
    return this.staticService.searchCountries(query)
  }

  @HttpCode(HttpStatus.OK)
  @Get('countries/:placeId')
  async getCountryCode(@Param('placeId') placeId: string) {
    return this.staticService.getCountryCode(placeId)
  }

  @HttpCode(HttpStatus.OK)
  @Get('cities/:countryCode')
  async getCities(
    @Param('countryCode') countryCode: string,
    @Query('query') query: string
  ) {
    return this.staticService.searchCities(query, countryCode)
  }
}
