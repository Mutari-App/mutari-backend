import {
  Controller,
  Post,
  UnauthorizedException,
  Headers,
  HttpStatus,
} from '@nestjs/common'
import { MeilisearchService } from './meilisearch.service'
import { ResponseUtil } from 'src/common/utils/response.util'

@Controller('meilisearch')
export class MeilisearchController {
  constructor(
    private readonly meilisearchService: MeilisearchService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Post('sync-itinerary-search-index')
  async syncItineraries(@Headers('x-api-key') apiKey: string) {
    if (!apiKey || apiKey !== process.env.MEILISEARCH_SYNC_KEY) {
      throw new UnauthorizedException('Invalid API key')
    }

    await this.meilisearchService.syncItineraries()
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Itineraries synced successfully',
    })
  }
}
