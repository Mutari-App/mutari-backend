import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { customAlphabet } from 'nanoid'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class VerificationCodeUtil {
  constructor(private readonly prisma: PrismaService) {}

  _generateVerificationCode() {
    return customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)()
  }

  async generate(userId: string) {
    const existedTickets = await this.prisma.ticket.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const latestExistedTicket = existedTickets[0]

    if (latestExistedTicket) {
      const createdAt = new Date(latestExistedTicket.createdAt)
      const timeDiff = new Date().getTime() - createdAt.getTime()
      const REQUEST_DELAY = Number(
        process.env.PRE_REGISTER_TICKET_REQUEST_DELAY || 300000
      )
      const timeLeft = REQUEST_DELAY - timeDiff
      if (timeLeft > 0)
        throw new BadRequestException(
          `Please wait ${Math.floor(timeLeft / 1000)} seconds before requesting another verification code`
        )
    }

    if (existedTickets.length >= 5) {
      const lastExistedTicket = existedTickets[existedTickets.length - 1]
      await this.prisma.ticket.delete({
        where: {
          id: lastExistedTicket.id,
        },
      })
    }

    let verificationCode: string
    let isDuplicate: boolean

    do {
      verificationCode = this._generateVerificationCode()
      const existingVerificationCode = await this.prisma.ticket.findUnique({
        where: { uniqueCode: verificationCode },
      })
      isDuplicate = !!existingVerificationCode
    } while (isDuplicate)

    const ticket = await this.prisma.ticket.create({
      data: {
        uniqueCode: verificationCode,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    })
    return ticket
  }

  async verify(verificationCode: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: {
        uniqueCode: verificationCode,
      },
      include: {
        user: true,
      },
    })

    if (!ticket) {
      throw new NotFoundException('Verification code not found')
    }

    if (ticket.user.id !== userId) {
      throw new UnauthorizedException('Invalid verification')
    }

    await this.prisma.ticket.deleteMany({
      where: {
        userId: userId,
      },
    })
  }
}
