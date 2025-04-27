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
    @Query('page') page: number = 1,
    @Query('tags') tags?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minDaysCount') minDaysCount?: string,
    @Query('maxDaysCount') maxDaysCount?: string,
    @Query('sortBy')
    sortBy: 'startDate' | 'endDate' | 'likes' | 'daysCount' = 'startDate',
    @Query('order') order: 'asc' | 'desc' = 'asc'
  ) {
    let filters = []

    if (tags) {
      const tagIds = tags.split(',')
      filters.push(
        `tags.tag.id IN [${tagIds.map((id) => `"${id}"`).join(', ')}]`
      )
    }

    if (startDate) {
      filters.push(`startDate >= "${new Date(startDate).toISOString()}"`)
    }

    if (endDate) {
      filters.push(`endDate <= "${new Date(endDate).toISOString()}"`)
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
      undefined,
      filtersString,
      sortBy,
      order
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

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    const itinerary = await this.itineraryService.findOne(id, user)
    if (!itinerary) {
      // throw new NotFoundException(`Itinerary with ID ${id} not found`)
      return {
        statusCode: HttpStatus.NOT_FOUND,
      }
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
}
