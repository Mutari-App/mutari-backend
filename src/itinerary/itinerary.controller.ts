import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Delete,
  BadRequestException,
} from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User } from '@prisma/client'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { PaginationDto } from './dto/pagination.dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Public } from 'src/common/decorators/public.decorator'

@Controller('itineraries')
export class ItineraryController {
  constructor(
    private readonly itineraryService: ItineraryService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Public()
  @Get('tags')
  async findAllTags() {
    const tags = await this.itineraryService.findAllTags()
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Tags fetched successfully.',
      },
      {
        tags,
      }
    )
  }

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

  @Get('me/completed')
  async findMyCompletedItineraries(@GetUser() user: User) {
    const itinerary = await this.itineraryService.findMyCompletedItineraries(
      user.id
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
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    const itinerary = await this.itineraryService.findOne(id, user)
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

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required')
    }

    const itinerary = await this.itineraryService.findByUser(userId)

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary fetched successfully.',
      },
      {
        itinerary,
      }
    )
  }

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

  @Patch(':id/mark-as-complete')
  async markAsComplete(@Param('id') id: string, @GetUser() user: User) {
    const itinerary = await this.itineraryService.markAsComplete(id, user.id)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary updated successfully.',
      },
      {
        itinerary,
      }
    )
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
