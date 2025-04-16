import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    })
    const { email: _email, password: _password, ...profile } = user

    return profile
  }
}
