import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common'
import { ProfileService } from './profile.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Public } from 'src/common/decorators/public.decorator'
import { UpdateProfileDTO } from './update-profile.dto'

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const profile = await this.profileService.findOne(id)
    return this.responseUtil.response(
      {
        message: 'Profile retrieved successfully',
        statusCode: HttpStatus.OK,
      },
      {
        profile,
      }
    )
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDTO
  ) {
    return null
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get(':id/itineraries')
  async getListItineraries(@Param('id') id: string) {
    const itineraries = await this.profileService.getListItineraries(id)
    return this.responseUtil.response(
      {
        message: 'List itinerary retrieved successfully',
        statusCode: HttpStatus.OK,
      },
      {
        itineraries,
      }
    )
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get(':id/itinerary-likes')
  async getListItineraryLikes(@Param('id') id: string) {
    const itineraryLikes = await this.profileService.getListItineraryLikes(id)
    return this.responseUtil.response(
      {
        message: 'List itinerary likes retrieved successfully',
        statusCode: HttpStatus.OK,
      },
      {
        itineraryLikes,
      }
    )
  }
}
