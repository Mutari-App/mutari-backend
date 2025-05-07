import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { BLOCK_TYPE, User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateProfileDTO } from './dto/update-profile.dto'
import { EmailService } from 'src/email/email.service'
import { emailChangeVerificationTemplate } from './change-email.template'
import { customAlphabet } from 'nanoid'
import { ChangePasswordDto } from './dto/change-password.dto'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  _generateVerificationCode() {
    return customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)()
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        photoProfile: true,
        firstName: true,
        lastName: true,
        referralCode: true,
        _count: {
          select: { referrals: true, itineraries: true },
        },
        loyaltyPoints: true,
        itineraries: {
          select: {
            _count: {
              select: { likes: true },
            },
          },
        },
      },
    })

    if (!user) throw new NotFoundException(`User with id ${id} not found`)

    const { _count, itineraries, ...userWithoutCount } = user

    const totalLikes = itineraries.reduce((total, itinerary) => {
      return total + itinerary._count.likes
    }, 0)

    return {
      ...userWithoutCount,
      totalReferrals: _count.referrals,
      totalItineraries: _count.itineraries,
      totalLikes,
    }
  }

  async getListItineraries(userId: string) {
    const itineraries = await this.prisma.itinerary.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        startDate: true,
        endDate: true,
        _count: {
          select: { likes: true },
        },
        sections: {
          select: {
            _count: {
              select: {
                blocks: {
                  where: { blockType: BLOCK_TYPE.LOCATION },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return itineraries.map((itinerary) => {
      const totalDestinations = itinerary.sections.reduce((total, section) => {
        return total + section._count.blocks
      }, 0)

      const {
        sections: _sections,
        _count,
        ...itineraryWithoutSections
      } = itinerary
      return {
        ...itineraryWithoutSections,
        totalLikes: _count.likes,
        totalDestinations,
      }
    })
  }

  async getListItineraryLikes(userId: string) {
    const itineraryLikes = await this.prisma.itineraryLike.findMany({
      where: { userId },
      select: {
        itinerary: {
          select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            startDate: true,
            endDate: true,
            _count: {
              select: { likes: true },
            },
            sections: {
              select: {
                _count: {
                  select: {
                    blocks: {
                      where: { blockType: BLOCK_TYPE.LOCATION },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return itineraryLikes.map((like) => {
      const totalDestinations = like.itinerary.sections.reduce(
        (total, section) => {
          return total + section._count.blocks
        },
        0
      )

      const {
        sections: _sections,
        _count,
        ...itineraryWithoutSections
      } = like.itinerary
      return {
        ...itineraryWithoutSections,
        totalLikes: _count.likes,
        totalDestinations,
      }
    })
  }

  async updateProfile(id: string, data: UpdateProfileDTO) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        ...(data.birthDate && { birthDate: new Date(data.birthDate) }),
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        email: true,
        isEmailConfirmed: true,
        firstName: true,
        lastName: true,
        photoProfile: true,
        birthDate: true,
      },
    })

    return updatedUser
  }

  async sendVerificationCode(user: User, email: string) {
    if (user.email === email) {
      throw new BadRequestException('Email is the same as current email')
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new BadRequestException('Email already in use')
    }

    const changeEmailTicket = await this._generateChangeEmailTicket(
      user.id,
      email
    )
    await this.emailService.sendEmail(
      email,
      'Verifikasi Perubahan Email - Mutari',
      emailChangeVerificationTemplate(
        user.firstName,
        changeEmailTicket.uniqueCode
      )
    )
  }

  async _generateChangeEmailTicket(userId: string, newEmail: string) {
    const existedChangeEmailTickets =
      await this.prisma.changeEmailTicket.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

    const latestExistedChangeEmailTicket = existedChangeEmailTickets[0]

    if (latestExistedChangeEmailTicket) {
      const createdAt = new Date(latestExistedChangeEmailTicket.createdAt)
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

    if (existedChangeEmailTickets.length >= 5) {
      const lastExistedTicket =
        existedChangeEmailTickets[existedChangeEmailTickets.length - 1]
      await this.prisma.changeEmailTicket.delete({
        where: {
          id: lastExistedTicket.id,
        },
      })
    }

    let verificationCode: string
    let isDuplicate: boolean

    do {
      verificationCode = this._generateVerificationCode()
      const existingVerificationCode =
        await this.prisma.changeEmailTicket.findUnique({
          where: { uniqueCode: verificationCode },
        })
      isDuplicate = !!existingVerificationCode
    } while (isDuplicate)

    const ticket = await this.prisma.changeEmailTicket.create({
      data: {
        newEmail,
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

  async _verifyChangeEmailTicket(verificationCode: string, userId: string) {
    const ticket = await this.prisma.changeEmailTicket.findUnique({
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

    // Check if the ticket has expired
    const now = new Date().getTime()
    const ticketCreatedAt = new Date(ticket.createdAt).getTime()
    const timeDiff = now - ticketCreatedAt
    const expiresIn = Number(
      process.env.PRE_REGISTER_TICKET_EXPIRES_IN || 300000
    )

    if (timeDiff > expiresIn) {
      throw new BadRequestException('Verification code has expired')
    }

    await this.prisma.changeEmailTicket.deleteMany({
      where: {
        userId: userId,
      },
    })

    return ticket.newEmail
  }

  async verifyEmailChange(user: User, code: string) {
    const newEmail = await this._verifyChangeEmailTicket(code, user.id)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    })
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    const isPasswordValid = await bcrypt.compare(
      data.oldPassword,
      user.password
    )
    if (!isPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect')
    }

    if (data.newPassword !== data.confirmPassword)
      throw new BadRequestException(
        'New password and confirmation do not match'
      )

    if (data.newPassword === data.oldPassword)
      throw new BadRequestException('New password cannot be the same as old')

    const saltOrRounds = bcrypt.genSaltSync(10)
    const hashedPassword = await bcrypt.hash(data.newPassword, saltOrRounds)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })
  }

  async updatePhotoProfile(userId: string, photoProfileUrl: string) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { photoProfile: photoProfileUrl },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        email: true,
        isEmailConfirmed: true,
        firstName: true,
        lastName: true,
        photoProfile: true,
        birthDate: true,
      },
    })
    return updatedUser
  }
}
