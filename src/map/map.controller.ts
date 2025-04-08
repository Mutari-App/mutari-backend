import { Controller, Get, HttpStatus, Query } from '@nestjs/common'
import { MapService } from './map.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Public } from 'src/common/decorators/public.decorator'

@Controller('map')
export class MapController {
  constructor(
    private readonly mapService: MapService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Public()
  @Get('details')
  async getPlaceDetails(@Query('placeId') placeId: string) {
    const details = await this.mapService.getPlaceDetails(placeId)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Place details fetched successfully.',
      },
      {
        details,
      }
    )
  }
}
