import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { ResponseUtil } from 'src/common/utils/response.util'

@Controller('itinerary')
export class ItineraryController {
  constructor(
    private readonly itineraryService: ItineraryService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Post()
  create(@Body() createItineraryDto: CreateItineraryDto) {
    return this.itineraryService.create(createItineraryDto)
  }

  @Get()
  findAll() {
    return this.itineraryService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itineraryService.findOne(+id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItineraryDto: UpdateItineraryDto
  ) {
    return this.itineraryService.update(+id, updateItineraryDto)
  }

  @Delete(':id')
  async removeItinerary(@Param('id') id: string) {
    await this.itineraryService.removeItinerary(id)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary deleted successfully.',
      },
      null
    )
  }
}
