import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ProfileService } from './profile.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Public } from 'src/common/decorators/public.decorator'
import { UpdateProfileDTO } from './dto/update-profile.dto'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { User } from '@prisma/client'
import { RequestChangeEmailDto } from './dto/request-email-change.dto'
import { EmailChangeVerificationDto } from './dto/email-change-verification.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Get('transactions')
  async getTransactionHistory(@GetUser() user: User) {
    const transactions = await this.profileService.getTransactionHistory(
      user.id
    )
    return this.responseUtil.response(
      {
        message: 'Transaction history fetched successfully',
        statusCode: HttpStatus.OK,
      },
      {
        transactions,
      }
    )
  }

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
  @Patch()
  async updateProfile(
    @GetUser() user: User,
    @Body() updateProfileDto: UpdateProfileDTO
  ) {
    const updatedProfile = await this.profileService.updateProfile(
      user.id,
      updateProfileDto
    )
    return this.responseUtil.response(
      {
        message: 'Profile updated successfully',
        statusCode: HttpStatus.OK,
      },
      {
        updatedProfile,
      }
    )
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/request-change')
  async requestChangeEmail(
    @GetUser() user: User,
    @Body() requestEmailChangeDTO: RequestChangeEmailDto
  ) {
    await this.profileService.sendVerificationCode(
      user,
      requestEmailChangeDTO.email
    )
    return this.responseUtil.response({
      message: 'Verification code sent to your email',
      statusCode: HttpStatus.OK,
    })
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/change-verification')
  async changeEmailVerification(
    @GetUser() user: User,
    @Body() changeEmailVerificationDTO: EmailChangeVerificationDto
  ) {
    await this.profileService.verifyEmailChange(
      user,
      changeEmailVerificationDTO.code
    )
    return this.responseUtil.response({
      message: 'Email changed successfully',
      statusCode: HttpStatus.OK,
    })
  }

  @HttpCode(HttpStatus.OK)
  @Patch('password')
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.profileService.changePassword(user.id, changePasswordDto)
    return this.responseUtil.response({
      message: 'Password changed successfully',
      statusCode: HttpStatus.OK,
    })
  }

  @HttpCode(HttpStatus.OK)
  @Patch('photo-profile')
  async updatePhotoProfile(
    @GetUser() user: User,
    @Body('photoProfileUrl') photoProfileUrl: string
  ) {
    const updatedProfile = await this.profileService.updatePhotoProfile(
      user.id,
      photoProfileUrl
    )
    return this.responseUtil.response(
      {
        message: 'Profile photo updated successfully',
        statusCode: HttpStatus.OK,
      },
      {
        updatedProfile,
      }
    )
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
