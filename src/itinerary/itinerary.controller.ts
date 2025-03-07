import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { Public } from 'src/common/decorators/public.decorator'
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
  async findOne(@Param('id') id: string) {
    const itinerary = await this.itineraryService.findOne(id)
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${id} not found`)
    }
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary fetched successfully.',
      },
      {
        data: itinerary,
      }
    )
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItineraryDto: UpdateItineraryDto
  ) {
    return this.itineraryService.update(+id, updateItineraryDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itineraryService.remove(+id)
  }
}
