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
