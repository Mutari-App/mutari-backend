import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common'
import { TourService } from './tour.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus } from '@nestjs/common/enums/http-status.enum'
import { Public } from 'src/common/decorators/public.decorator'
import { User } from '@prisma/client'
import { GetUser } from 'src/common/decorators/getUser.decorator'

@Controller('tour')
export class TourController {
  constructor(
    private readonly tourService: TourService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tour = await this.tourService.findOne(id)

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Tour fetched successfully.',
      },
      {
        data: tour,
      }
    )
  }

  @Post('views/:tourId')
  async createTourView(@GetUser() user: User, @Param('tourId') tourId: string) {
    const tour = await this.tourService.createTourView(tourId, user)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Tour view added successfully',
      },
      {
        tour,
      }
    )
  }

  @Get('views')
  async getTourView(@GetUser() user: User) {
    const tours = await this.tourService.getTourView(user)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Tour views fetched successfully',
      },
      {
        tours,
      }
    )
  }

  @Public()
  @Get('search')
  async searchTours(
    @Query('q') query: string = '',
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('location') location?: string,
    @Query('minPrice', new ParseFloatPipe({ optional: true }))
    minPrice?: number,
    @Query('maxPrice', new ParseFloatPipe({ optional: true }))
    maxPrice?: number,
    @Query('minDuration', new ParseIntPipe({ optional: true }))
    minDuration?: number,
    @Query('maxDuration', new ParseIntPipe({ optional: true }))
    maxDuration?: number,
    @Query('durationType') durationType?: string,
    @Query('hasAvailableTickets') hasAvailableTickets?: string,
    @Query('sortBy')
    sortBy:
      | 'pricePerTicket'
      | 'duration'
      | 'availableTickets'
      | 'createdAt' = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc'
  ) {
    const hasTicketsFilter = hasAvailableTickets === 'true' ? true : undefined

    return this.tourService.searchTours(
      query,
      page,
      limit,
      {
        location,
        minPrice,
        maxPrice,
        minDuration,
        maxDuration,
        durationType,
        hasAvailableTickets: hasTicketsFilter,
      },
      sortBy,
      order
    )
  }

  @Public()
  @Get('suggestions')
  async getSearchSuggestions(@Query('q') query: string = '') {
    if (query.length < 2) {
      return { suggestions: [] }
    }

    const results = await this.tourService.searchTours(query, 1, 10)

    // Extract unique titles and locations and format them as suggestions
    const suggestions = [
      ...new Set(
        [
          ...results.data.map((item) => item.title),
          ...results.data.map((item) => item.location),
        ].filter(Boolean)
      ),
    ]

    return {
      suggestions: suggestions.slice(0, 5),
    }
  }
}
