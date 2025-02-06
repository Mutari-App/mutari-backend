import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { ResponseUtil } from 'src/common/utils/response.util'

@Injectable()
export class PreRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseUtil: ResponseUtil
  ) {}

  async createPreRegister(preRegisterDto: PreRegisterDTO) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: preRegisterDto.email },
    })

    if (existingUser) {
      throw new BadRequestException(
        'The email is already registered. Please use a different email.'
      )
    }

    const user = await this.prisma.user.create({
      data: {
        email: preRegisterDto.email,
        firstName: preRegisterDto.firstName,
        lastName: preRegisterDto.lastName,
        phoneNumber: preRegisterDto.phoneNumber,
        city: preRegisterDto.city,
        country: preRegisterDto.country,
      },
    })
    return this.responseUtil.response(
      {
        code: HttpStatus.OK,
        message: 'Pre-registration successful',
      },
      { user }
    )
  }

  async getPreRegisterCount() {
    const count = await this.prisma.user.count({})
    return this.responseUtil.response(
      {
        code: HttpStatus.OK,
        message: 'Total pre-registered users retrieved successfully.',
      },
      { count }
    )
  }
}
