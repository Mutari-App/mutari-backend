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
import { TourService } from './tour.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { User } from '@prisma/client'
import { GetUser } from 'src/common/decorators/getUser.decorator'

@Controller('tour')
export class TourController {
  constructor(
    private readonly tourService: TourService,
    private readonly responseUtil: ResponseUtil
  ) {}

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
}
