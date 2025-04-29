import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  HttpStatus,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common'
import { ItineraryService } from './itinerary.service'
import { CreateItineraryDto } from './dto/create-itinerary.dto'
import { UpdateItineraryDto } from './dto/update-itinerary.dto'
import { User } from '@prisma/client'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { PaginationDto } from './dto/pagination.dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Public } from 'src/common/decorators/public.decorator'
import { InviteToItineraryDTO } from './dto/invite-to-itinerary.dto'
import { CreateContingencyPlanDto } from './dto/create-contingency-plan.dto'
import { SemiPublic } from 'src/common/decorators/semiPublic.decorator'

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

  @Public()
  @Get('search')
  async searchItineraries(
    @Query('q') query: string = '',
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('tags') tags?: string,
    @Query('minDaysCount') minDaysCount?: string,
    @Query('maxDaysCount') maxDaysCount?: string,
    @Query('sortBy')
    sortBy: 'createdAt' | 'likes' | 'daysCount' = 'likes',
    @Query('order') order: 'asc' | 'desc' = 'desc'
  ) {
    let filters = []

    if (tags) {
      const tagIds = tags.split(',')
      filters.push(
        `tags.tag.id IN [${tagIds.map((id) => `"${id}"`).join(', ')}]`
      )
    }

    if (minDaysCount) {
      filters.push(`daysCount >= ${parseInt(minDaysCount)}`)
    }

    if (maxDaysCount) {
      filters.push(`daysCount <= ${parseInt(maxDaysCount)}`)
    }

    const filtersString = filters.length > 0 ? filters.join(' AND ') : undefined

    return this.itineraryService.searchItineraries(
      query,
      page,
      limit,
      filtersString,
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

    const results = await this.itineraryService.searchItineraries(query, 1, 10)

    // Extract unique titles and format them as suggestions
    const suggestions = [...new Set(results.data.map((item) => item.title))]

    return {
      suggestions: suggestions.slice(0, 5),
    }
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

  @Get('me/all')
  async findAllMyItineraries(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto,
    @Query('shared') shared?: string,
    @Query('finished') finished?: string
  ) {
    const sharedBool = shared === 'true'
    const finishedBool = finished === 'true'

    const itinerary = await this.itineraryService.findAllMyItineraries(
      user.id,
      parseInt(paginationDto.page),
      sharedBool,
      finishedBool
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'All itineraries fetched successfully.',
      },
      {
        itinerary,
      }
    )
  }

  @Get('me/shared')
  async findMyShareditineraries(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto
  ) {
    const itinerary = await this.itineraryService.findMySharedItineraries(
      user.id,
      parseInt(paginationDto.page)
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Shared itineraries fetched successfully.',
      },
      {
        itinerary,
      }
    )
  }

  @Get('me/completed')
  async findMyCompletedItineraries(
    @GetUser() user: User,
    @Query() paginationDto: PaginationDto
  ) {
    const itinerary = await this.itineraryService.findMyCompletedItineraries(
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

  @Get('me/explore-by-latest-tags')
  async findItinerariesByLatestTags(@GetUser() user) {
    const itineraries =
      await this.itineraryService.findItinerariesByLatestTags(user)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Explore itineraries successfully fetched',
      },
      { itineraries }
    )
  }

  @Get('views')
  async getViewItinerary(@GetUser() user: User) {
    const itineraries = await this.itineraryService.getViewItinerary(user)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary views fetched successfully',
      },
      {
        itineraries,
      }
    )
  }

  @Get('/trending')
  async findTrendingItineraries() {
    const itineraries = await this.itineraryService.findTrendingItineraries()
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Trending itineraries fetched successfully.',
      },
      {
        itineraries,
      }
    )
  }

  @SemiPublic()
  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() user?: User) {
    const itinerary = await this.itineraryService.findOne(id, user)
    if (!itinerary) {
      return this.responseUtil.response({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Itinerary with ID ${id} not found`,
      })
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

  @Post('views/:itineraryId')
  async createViewItinerary(
    @GetUser() user: User,
    @Param('itineraryId') itineraryId: string
  ) {
    const itinerary = await this.itineraryService.createViewItinerary(
      itineraryId,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary view added successfully',
      },
      {
        itinerary,
      }
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
  async removeItinerary(@Param('id') id: string, @GetUser() user: User) {
    await this.itineraryService.removeItinerary(id, user)
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Itinerary deleted successfully.',
    })
  }

  @Post(':id/invite')
  async inviteToItinerary(
    @Param('id') id: string,
    @Body() inviteToItineraryDto: InviteToItineraryDTO,
    @GetUser() user: User
  ) {
    const result = await this.itineraryService.inviteToItinerary(
      id,
      inviteToItineraryDto.emails,
      user.id
    )

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'User invited successfully.',
      },
      {
        pendingItineraryInvites: result,
      }
    )
  }

  @Post(':itineraryId/accept-invitation')
  async acceptItineraryInvitation(
    @Param('itineraryId') itineraryId: string,
    @GetUser() user: User
  ) {
    await this.itineraryService.acceptItineraryInvitation(itineraryId, user)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Invitation accepted successfully.',
      },
      {
        itineraryId,
      }
    )
  }

  @Delete(':id/:userId/remove')
  async removeUserFromItinerary(
    @Param('id') itineraryId: string,
    @Param('userId') targetId: string,
    @GetUser() user: User
  ) {
    const deletedParticipant =
      await this.itineraryService.removeUserFromItinerary(
        itineraryId,
        targetId,
        user
      )

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'User removed from itinerary successfully.',
      },
      {
        deletedParticipant,
      }
    )
  }

  @Get('/:itineraryId/contingencies')
  async findContingencies(
    @Param('itineraryId') itineraryId: string,
    @GetUser() user: User
  ) {
    const contingencies = await this.itineraryService.findContingencyPlans(
      itineraryId,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Contingencies fetched successfully.',
      },
      {
        contingencies,
      }
    )
  }

  @Get('/:itineraryId/contingencies/:contingencyId')
  async findContingencyById(
    @Param('itineraryId') itineraryId: string,
    @Param('contingencyId') contingencyId: string,
    @GetUser() user: User
  ) {
    const contingency = await this.itineraryService.findContingencyPlan(
      itineraryId,
      contingencyId,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Contingency fetched successfully.',
      },
      {
        contingency,
      }
    )
  }

  @Post('/:itineraryId/contingencies')
  async createContingency(
    @Param('itineraryId') itineraryId: string,
    @GetUser() user: User,
    @Body() createContigencyPlanDto: CreateContingencyPlanDto
  ) {
    const contingency = await this.itineraryService.createContingencyPlan(
      itineraryId,
      createContigencyPlanDto,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Contingency created successfully.',
      },
      {
        contingency,
      }
    )
  }

  @Patch('/:itineraryId/contingencies/select/:contingencyId')
  async selectContingency(
    @Param('itineraryId') itineraryId: string,
    @Param('contingencyId') contingencyId: string,
    @GetUser() user: User
  ) {
    const contingency = await this.itineraryService.selectContingencyPlan(
      itineraryId,
      contingencyId,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Contingency selected successfully.',
      },
      {
        contingency,
      }
    )
  }

  @Patch('/:itineraryId/contingencies/:contingencyId')
  async updateContingency(
    @Param('itineraryId') itineraryId: string,
    @Param('contingencyId') contingencyId: string,
    @GetUser() user: User,
    @Body() updateContingencyPlanDto: CreateContingencyPlanDto
  ) {
    const contingency = await this.itineraryService.updateContingencyPlan(
      itineraryId,
      contingencyId,
      updateContingencyPlanDto,
      user
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Contingency updated successfully.',
      },
      {
        contingency,
      }
    )
  }

  @Patch(':itineraryId/publish')
  async publishItinerary(
    @Param('itineraryId') id: string,
    @GetUser() user: User,
    @Body('isPublished') isPublished: boolean
  ) {
    const publishedItinerary = await this.itineraryService.publishItinerary(
      id,
      user,
      isPublished
    )

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary published successfully',
      },
      publishedItinerary
    )
  }

  @Post(':itineraryId/duplicate')
  async duplicateItineraryAndContingencies(
    @Param('itineraryId') itineraryId: string,
    @GetUser() user: User
  ) {
    // 1: Duplicate Itinerary
    const duplicatedItinerary = await this.itineraryService.duplicateItinerary(
      itineraryId,
      user
    )

    // 2: Duplicate Contingencies
    const existingContingencies =
      await this.itineraryService.findContingencyPlans(itineraryId, user)
    if (existingContingencies.length > 0) {
      for (const plan of existingContingencies) {
        await this.itineraryService.duplicateContingency(
          duplicatedItinerary.id,
          itineraryId,
          plan.id,
          user
        )
      }
    }

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary duplicated successfully',
      },
      {
        duplicatedItinerary,
      }
    )
  }

  @Post(':itineraryId/save')
  async saveItinerary(@Param('itineraryId') id: string, @GetUser() user: User) {
    const itineraryLike = await this.itineraryService.saveItinerary(id, user)

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary saved successfully',
      },
      itineraryLike
    )
  }

  @Delete(':itineraryId/save')
  async unsaveItinerary(
    @Param('itineraryId') id: string,
    @GetUser() user: User
  ) {
    await this.itineraryService.unsaveItinerary(id, user)

    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Itinerary unsaved successfully',
    })
  }

  @Post('/checkSave')
  async batchCheckUserSavedItinerary(
    @GetUser() user: User,
    @Body() itineraryIds: string[]
  ) {
    const result = await this.itineraryService.batchCheckUserSavedItinerary(
      itineraryIds,
      user
    )

    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itineraries saved status fetched succesfully',
      },
      { result }
    )
  }
}
