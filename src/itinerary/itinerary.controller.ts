import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
} from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { PaginationDto } from './dto/pagination.dto'
import { User } from '@prisma/client'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Public } from 'src/common/decorators/public.decorator'

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

  @Public()
  @Get('me')
  async findMyItineraries(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto
  ) {
    const itinerary = await this.itineraryService.findMyItineraries(
      user.id,
      parseInt(paginationDto.page)
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itineraries fetched successfully.',
      },
      {
        itinerary,
      }
    )
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
  remove(@Param('id') id: string) {
    return this.itineraryService.remove(+id)
  }
}
