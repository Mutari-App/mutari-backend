import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common'
import { StaticService } from './static.service'
import { Public } from 'src/common/decorators/public.decorator'

@Controller('static')
export class StaticController {
  constructor(private readonly staticService: StaticService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('countries')
  async getCountries(@Query('query') query: string) {
    return this.staticService.searchCountries(query)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('countries/:placeId')
  async getCountryCode(@Param('placeId') placeId: string) {
    return this.staticService.getCountryCode(placeId)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('cities/:placeId')
  async getCities(
    @Param('placeId') placeId: string,
    @Query('query') query: string
  ) {
    return this.staticService.searchCities(query, placeId)
  }
}
