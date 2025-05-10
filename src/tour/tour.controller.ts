import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common'
import { TourService } from './tour.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { Public } from '../common/decorators/public.decorator'

@Controller('tour')
export class TourController {
  constructor(private readonly tourService: TourService) {}

  @Post()
  create(@Body() createTourDto: CreateTourDto) {
    return this.tourService.create(createTourDto)
  }

  @Get()
  findAll() {
    return this.tourService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tourService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTourDto: UpdateTourDto) {
    return this.tourService.update(id, updateTourDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tourService.remove(id)
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
