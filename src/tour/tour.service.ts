import { Injectable } from '@nestjs/common'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class TourService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  create(createTourDto: CreateTourDto) {
    return 'This action adds a new tour'
  }

  findAll() {
    return `This action returns all tour`
  }

  findOne(id: string) {
    return `This action returns a #${id} tour`
  }

  update(id: number, updateTourDto: UpdateTourDto) {
    return `This action updates a #${id} tour`
  }

  remove(id: number) {
    return `This action removes a #${id} tour`
  }
}
