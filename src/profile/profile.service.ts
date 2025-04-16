import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}
  async findOne(id: string) {
    return null
  }
}
