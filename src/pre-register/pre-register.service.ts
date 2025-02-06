import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PreRegisterDTO } from './dto/pre-register.dto'

@Injectable()
export class PreRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async createPreRegister(preRegisterDto: PreRegisterDTO) {
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

    return { message: 'Pre-register successful', user }
  }

  async getPreRegisterCount() {
    const count = await this.prisma.user.count({})

    return { count }
  }
}
