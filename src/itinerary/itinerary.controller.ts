import { Controller, Post, Body, HttpStatus, Param, Patch } from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User } from '@prisma/client'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { ResponseUtil } from 'src/common/utils/response.util'

@Controller('itineraries')
export class ItineraryController {
  constructor(
    private readonly responseUtil: ResponseUtil,
    private readonly itineraryService: ItineraryService
  ) {}

  @Post()
  async createItinerary(
    @GetUser() user: User,
    @Body() createItineraryDto: CreateItineraryDto
  ) {
    const itinerary = await this.itineraryService.createItinerary(
      createItineraryDto,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary created successfully',
      },
      itinerary
    )
  }
  
  @Patch(':id')
  async updateItinerary(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateItineraryDto: UpdateItineraryDto
  ) {
    const itinerary = await this.itineraryService.updateItinerary(
      id,
      updateItineraryDto,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary updated successfully',
      },
      itinerary
    )
  }
}
