import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { customAlphabet } from 'nanoid'

const generatedReferralCode = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8
)

@Injectable()
export class PreRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseUtil: ResponseUtil
  ) {}

  _generateReferralCode() {
    return generatedReferralCode()
  }

  async createPreRegister(preRegisterDto: PreRegisterDTO) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: preRegisterDto.email },
    })

    if (existingUser) {
      throw new BadRequestException(
        'The email is already registered. Please use a different email.'
      )
    }

    const referredUser = await this.prisma.user.findUnique({
      where: { referralCode: preRegisterDto.referralCode.toUpperCase() },
    })

    let referralCode: string
    let isDuplicate: boolean

    do {
      referralCode = this._generateReferralCode()
      const existingReferral = await this.prisma.user.findUnique({
        where: { referralCode },
      })
      isDuplicate = !!existingReferral
    } while (isDuplicate)

    const user = await this.prisma.user.create({
      data: {
        email: preRegisterDto.email,
        firstName: preRegisterDto.firstName,
        lastName: preRegisterDto.lastName,
        phoneNumber: preRegisterDto.phoneNumber,
        city: preRegisterDto.city,
        country: preRegisterDto.country,
        referralCode: referralCode.toUpperCase(),
        ...(!!referredUser && {
          referredBy: {
            connect: {
              id: referredUser.id,
            },
          },
        }),
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
