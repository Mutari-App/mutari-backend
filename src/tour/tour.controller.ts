import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common'
import { TourService } from './tour.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus } from '@nestjs/common/enums/http-status.enum'
import { Public } from 'src/common/decorators/public.decorator'

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
}
