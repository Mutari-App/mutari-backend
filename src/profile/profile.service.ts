import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { BLOCK_TYPE, User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateProfileDTO } from './dto/update-profile.dto'
import * as bcrypt from 'bcryptjs'
import { EmailService } from 'src/email/email.service'
import { VerificationCodeUtil } from 'src/common/utils/verification-code.util'
import { emailChangeVerificationTemplate } from './change-email.template'

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly verificationCodeUtil: VerificationCodeUtil
  ) {}

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
        birthDate: data.birthDate,
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

    const verificationCode = await this.verificationCodeUtil.generate(user.id)
    await this.emailService.sendEmail(
      email,
      'Verifikasi Perubahan Email - Mutari',
      emailChangeVerificationTemplate(
        user.firstName,
        verificationCode.uniqueCode
      )
    )
  }

  async verifyEmailChange(user: User, code: string) {
    return null
  }
}
