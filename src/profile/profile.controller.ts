import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { ResponseUtil } from 'src/common/utils/response.util'

@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return null
  }
}
