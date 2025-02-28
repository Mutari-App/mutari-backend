import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { EmailService } from 'src/email/email.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { customAlphabet } from 'nanoid'
import { Prisma, User } from '@prisma/client'
import { CreateUserDTO } from './dto/create-user-dto'
import { verificationCodeTemplate } from './templates/verification-code-template'
import { VerifyRegistrationDTO } from './dto/verify-registration-dto'
import { RegisterDTO } from './dto/register-dto'
import { newUserRegistrationTemplate } from './templates/new-user-registration-template'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  _generateVerificationCode() {
    return customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)()
  }

  async _generateUniqueVerificationCode(
    prisma: Prisma.TransactionClient,
    user: User
  ) {
    const existedTickets = await prisma.ticket.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const latestExistedTicket = existedTickets[0]

    if (!!latestExistedTicket) {
      const createdAt = new Date(latestExistedTicket.createdAt)
      const timeDiff = new Date().getTime() - createdAt.getTime()
      const timeLeft =
        Number(process.env.PRE_REGISTER_TICKET_REQUEST_DELAY) - timeDiff
      if (timeLeft > 0)
        throw new BadRequestException(
          `Please wait ${Math.floor(timeLeft / 1000)} seconds before requesting another verification code`
        )
    }

    if (existedTickets.length >= 5) {
      const lastExistedTicket = existedTickets[existedTickets.length - 1]
      await prisma.ticket.delete({
        where: {
          id: lastExistedTicket.id,
        },
      })
    }

    let verificationCode: string
    let isDuplicate: boolean

    do {
      verificationCode = this._generateVerificationCode()
      const existingVerificationCode = await prisma.ticket.findUnique({
        where: { uniqueCode: verificationCode },
      })
      isDuplicate = !!existingVerificationCode
    } while (isDuplicate)

    const ticket = await prisma.ticket.create({
      data: {
        uniqueCode: verificationCode,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })

    return ticket
  }

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

  async sendVerification(data: CreateUserDTO) {
    let user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    })

    if (!user) {
      throw new BadRequestException('Invalid verification code')
    }

    const verificationCode = await this._generateUniqueVerificationCode(
      this.prisma,
      user
    )

    await this.emailService.sendEmail(
      data.email,
      'Your Mutari Verification Code',
      verificationCodeTemplate(user.firstName, verificationCode.uniqueCode)
    )
  }

  async verify(data: VerifyRegistrationDTO) {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        uniqueCode: data.verificationCode,
      },
      include: {
        user: true,
      },
    })

    if (!ticket) {
      throw new NotFoundException('Verification code not found')
    }

    if (
      ticket.user.email !== data.email ||
      ticket.user.firstName !== data.firstName
    ) {
      throw new UnauthorizedException('Invalid verification')
    }
  }

  async register(data: RegisterDTO) {
    await this.verify(data)

    if (data.password != data.confirmPassword) {
      throw new BadRequestException('Password does not match')
    }

    const saltOrRounds = bcrypt.genSaltSync(10)
    const hashedPassword = await bcrypt.hash(data.password, saltOrRounds)

    const newUser = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    })

    if (!newUser) {
      throw new NotFoundException('User not found')
    }

    await this.prisma.user.update({
      where: {
        email: newUser.email,
      },
      data: {
        password: hashedPassword,
        isEmailConfirmed: true,
      },
    })

    await this.prisma.ticket.deleteMany({
      where: {
        userId: newUser.id,
      },
    })

    await this.emailService.sendEmail(
      data.email,
      'Register Successful!',
      newUserRegistrationTemplate(data.firstName)
    )
  }
}
