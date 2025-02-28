import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { EmailService } from 'src/email/email.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateUserDTO } from './dto/create-user-dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  async createUser(data: CreateUserDTO) {
    let user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    })

    if (user && user.isEmailConfirmed) {
      throw new ConflictException('User already exists')
    } else if (user && !user.isEmailConfirmed) {
      const createdAt = new Date(user.createdAt)
      const timeDiff = new Date().getTime() - createdAt.getTime()
      const timeLeft = 5 * 60 * 1000 - timeDiff
      if (timeLeft > 0) {
        throw new BadRequestException(
          `Please check your email to verify your account. You can wait  ${Math.floor(timeLeft / 1000)} seconds before requesting another register verification code`
        )
      }
    } else {
      user = await this.prisma.user.create({
        data,
      })
    }
  }
}
