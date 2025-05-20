import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { EmailService } from 'src/email/email.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { customAlphabet } from 'nanoid'
import { Prisma, Ticket, User } from '@prisma/client'
import { CreateUserDTO } from './dto/create-user.dto'
import { verificationCodeTemplate } from './templates/verification-code.template'
import { VerifyRegistrationDTO } from './dto/verify-registration.dto'
import { RegisterDTO } from './dto/register.dto'
import { newUserRegistrationTemplate } from './templates/new-user-registration.template'
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'
import { Cron, CronExpression } from '@nestjs/schedule'
import { LoginDTO } from './dto/login.dto'
import { RequestPasswordResetDTO } from './dto/request-pw-reset.dto'
import { resetPasswordTemplate } from './templates/reset-pw-template'
import { VerifyPasswordResetDTO } from './dto/verify-pw-reset.dto'
import { PasswordResetDTO } from './dto/pw-reset.dto'
import { successPasswordResetTemplate } from './templates/success-pw-reset-template'
import { GoogleAuthDTO } from './dto/google-auth-dto'
import * as admin from 'firebase-admin'
import { initFirebaseAdmin } from 'src/firebase/firebase'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService
  ) {}

  async login(loginDto: LoginDTO) {
    const { email, password } = loginDto

    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Incorrect Email or Password')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect Email or Password')
    }

    const accessToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    const refreshToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }
    )

    return { accessToken, refreshToken }
  }

  async verifyFirebaseToken(googleAuth: GoogleAuthDTO) {
    const { firebaseToken } = googleAuth

    try {
      const firebaseAdminApp = admin.apps.length ? admin : initFirebaseAdmin()

      const {
        email,
        uid: firebaseUid,
        name,
      } = await firebaseAdminApp.auth().verifyIdToken(firebaseToken)

      if (!email) {
        throw new InternalServerErrorException('Verify firebase token failed')
      }

      return { email, firebaseUid, name }
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message)
    }
  }

  async googleLogin(googleAuthDTO: GoogleAuthDTO) {
    const { email, firebaseUid } = await this.verifyFirebaseToken(googleAuthDTO)

    const user = await this.prisma.user.findUnique({
      where: { email, firebaseUid },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const accessToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    const refreshToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }
    )

    return { accessToken, refreshToken }
  }

  async googleRegister(googleAuthDTO: GoogleAuthDTO) {
    let { email, firebaseUid, name } =
      await this.verifyFirebaseToken(googleAuthDTO)

    let user = await this.prisma.user.findUnique({
      where: { email: email, firebaseUid: firebaseUid },
    })

    if (user) {
      throw new ConflictException('User already exists')
    }

    name ??= email.split('@')[0]

    user = await this.prisma.user.upsert({
      where: { email: email },
      update: {
        firebaseUid: firebaseUid,
        isEmailConfirmed: true,
      },
      create: {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        email: email,
        firebaseUid: firebaseUid,
        isEmailConfirmed: true,
      },
    })

    const accessToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    const refreshToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }
    )

    return { accessToken, refreshToken }
  }

  async linkAccount(user: User, linkaccountDTO: GoogleAuthDTO) {
    const { firebaseUid, email } =
      await this.verifyFirebaseToken(linkaccountDTO)

    if (user.email !== email) {
      throw new BadRequestException('Invalid email')
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email },
    })

    if (!existingUser) {
      throw new NotFoundException('User not found')
    }

    if (existingUser.firebaseUid) {
      throw new ConflictException('User already linked with another account')
    }

    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: { firebaseUid: firebaseUid },
    })
  }

  private isRefreshTokenBlackListed(refreshToken: string, userId: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId,
      },
    })
  }

  async refreshToken(
    user: User,
    currentRefreshToken: string,
    currentRefreshTokenExpiresAt: Date
  ) {
    if (await this.isRefreshTokenBlackListed(currentRefreshToken, user.id)) {
      throw new UnauthorizedException('Invalid refresh token.')
    }

    const newRefreshToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }
    )

    await this.prisma.refreshToken.create({
      data: {
        token: currentRefreshToken,
        expiresAt: currentRefreshTokenExpiresAt,

        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })
    const accessToken = await this.jwtService.signAsync(
      { userId: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    return {
      accessToken,
      refreshToken: newRefreshToken,
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async clearExpiredRefreshTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    })
  }

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

    if (user?.isEmailConfirmed) {
      throw new ConflictException('User already exists')
    } else if (user && !user.isEmailConfirmed) {
      const createdAt = new Date(user.createdAt)
      const timeDiff = new Date().getTime() - createdAt.getTime()
      const timeLeft = 5 * 60 * 1000 - timeDiff
      if (timeLeft > 0) {
        throw new BadRequestException(
          `Please check your email to verify your account. You can wait ${Math.floor(timeLeft / 1000)} seconds before requesting another register verification code`
        )
      }
    } else {
      await this.prisma.user.create({
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

  _checkTicketExpiration(ticket: Ticket) {
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

    this._checkTicketExpiration(ticket)
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

  async sendPasswordResetVerification(data: RequestPasswordResetDTO) {
    let user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
        isEmailConfirmed: true,
      },
    })

    if (!user) {
      throw new BadRequestException('Email address is invalid')
    }

    const verificationCode = await this._generateUniqueVerificationCode(
      this.prisma,
      user
    )

    await this.emailService.sendEmail(
      data.email,
      'Please reset your password',
      resetPasswordTemplate(verificationCode.uniqueCode)
    )
  }

  async verifyPasswordReset(data: VerifyPasswordResetDTO) {
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

    if (ticket.user.email !== data.email) {
      throw new UnauthorizedException('Invalid verification')
    }

    this._checkTicketExpiration(ticket)
  }

  async resetPassword(data: PasswordResetDTO) {
    await this.verifyPasswordReset(data)

    if (data.password != data.confirmPassword) {
      throw new BadRequestException('Password does not match')
    }

    const saltOrRounds = bcrypt.genSaltSync(10)
    const hashedPassword = await bcrypt.hash(data.password, saltOrRounds)

    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        password: hashedPassword,
      },
    })

    await Promise.all([
      this.prisma.ticket.deleteMany({ where: { userId: user.id } }),
      this.emailService.sendEmail(
        data.email,
        'Your password has been reset',
        successPasswordResetTemplate()
      ),
    ])
  }
}
