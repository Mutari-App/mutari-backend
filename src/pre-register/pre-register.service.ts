import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { customAlphabet } from 'nanoid'
import { EmailService } from 'src/email/email.service'
import { JwtService } from '@nestjs/jwt'
import { Prisma, User } from '@prisma/client'

const generatedReferralCode = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8
)

@Injectable()
export class PreRegisterService {
  private DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL // Simpan di .env

  constructor(
    private readonly prisma: PrismaService,
    private readonly responseUtil: ResponseUtil,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService
  ) {}

  _generateReferralCode() {
    return generatedReferralCode()
  }

  async _generateUniqueReferralCode(prisma: Prisma.TransactionClient) {
    let referralCode: string
    let isDuplicate: boolean

    do {
      referralCode = this._generateReferralCode() // Gantilah ini dengan fungsi yang benar untuk menghasilkan kode
      const existingReferral = await prisma.user.findUnique({
        where: { referralCode },
      })
      isDuplicate = !!existingReferral
    } while (isDuplicate)

    return referralCode
  }

  async createPreRegister(preRegisterDto: PreRegisterDTO) {
    const user = await this.prisma.$transaction(async (prisma) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: preRegisterDto.email },
      })

      if (existingUser) {
        throw new BadRequestException(
          'The email is already registered. Please use a different email.'
        )
      }

      let referredUser

      if (!!preRegisterDto.referralCode) {
        referredUser = await prisma.user.findUnique({
          where: { referralCode: preRegisterDto.referralCode.toUpperCase() },
        })

        if (!referredUser)
          throw new NotFoundException('Referral Code not found!')
      }

      const user = await prisma.user.create({
        data: {
          email: preRegisterDto.email,
          firstName: preRegisterDto.firstName,
          lastName: preRegisterDto.lastName,
          phoneNumber: preRegisterDto.phoneNumber,
          ...(!!referredUser && {
            referredBy: {
              connect: {
                id: referredUser.id,
              },
            },
          }),
        },
      })

      this.sendDiscordWebhook(user, 'pre-registration', {
        referralCodeUsed: referredUser?.referralCode,
      })

      return user
    })

    const ticket = await this._generateTicket(this.prisma, user.id)

    await this.emailService.sendEmail(
      user.email,
      'Your Mutari Login Link',
      this._emailConfirmationTemplate(ticket.id)
    )
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Pre-registration successful',
      },
      { user }
    )
  }

  private async sendDiscordWebhook(
    user: User,
    eventType: 'pre-registration' | 'login-validation',
    extraData: any = {}
  ) {
    if (!this.DISCORD_WEBHOOK_URL) {
      console.log('DISCORD_WEBHOOK_URL not setup yet!')
      return
    }

    try {
      // Format tanggal pendaftaran atau login
      const eventDate = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      let messageContent = ''

      if (eventType === 'pre-registration') {
        messageContent = `
  >>> 
  🚀 **New Pre-Registration!** 🎉
  
  **User Information:**
  👤 **Name:** ${user.firstName} ${user.lastName}
  📧 **Email:** ${user.email}
  📱 **Phone:** ${user.phoneNumber || 'N/A'}
  📅 **Registration Date:** ${eventDate}
  📝 **Referral Code Used:** ${extraData.referralCodeUsed || 'None'}
  
  🔹 Keep up the great work! 🚀
        `
      } else if (eventType === 'login-validation') {
        messageContent = `
  >>> 
  ✅ **User Email Successfully Validated !** 🔑
  
  **User Information:**
  👤 **Name:** ${user.firstName} ${user.lastName}
  📧 **Email:** ${user.email}
  📅 **Validattion Date:** ${eventDate}
  📝 **Referral Code:** ${user.referralCode || 'None'}
  
  🎉 Welcome back, ${user.firstName}! 🚀
        `
      }

      const message = { content: messageContent }

      await fetch(this.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      console.log(`✅ Webhook sent successfully for ${eventType}`)
    } catch (error) {
      console.error(`❌ Failed to send webhook for ${eventType}:`, error)
    }
  }

  async getPreRegisterCount() {
    const count = await this.prisma.user.count({})
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Total pre-registered users retrieved successfully.',
      },
      { count }
    )
  }

  async login(email: string) {
    const ticket = await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { email },
      })
      if (!user) throw new BadRequestException('Email is not registered.')

      const ticket = await this._generateTicket(prisma, user.id)

      return ticket
    })

    await this.emailService.sendEmail(
      email,
      'Your Mutari Login Link',
      this._emailConfirmationTemplate(ticket.id)
    )
    return this.responseUtil.response({
      statusCode: HttpStatus.OK,
      message: 'Login email sent successfully',
    })
  }

  async validateLogin(ticketId: string) {
    const confirmedResult = await this.prisma.$transaction(async (prisma) => {
      const ticket = await prisma.ticket.findUnique({
        where: {
          id: ticketId,
        },
        select: {
          createdAt: true,
          userId: true,
          user: {
            select: {
              referralCode: true,
              isEmailConfirmed: true,
            },
          },
        },
      })

      if (!ticket)
        throw new UnauthorizedException('Invalid or expired login ticket.')

      const timeDiff = new Date().getTime() - ticket.createdAt.getTime()
      if (timeDiff > Number(process.env.PRE_REGISTER_TICKET_EXPIRES_IN))
        throw new UnauthorizedException('Invalid or expired login ticket.')

      await prisma.ticket.deleteMany({
        where: { userId: ticket.userId },
      })

      const updatedUser = await prisma.user.update({
        where: {
          id: ticket.userId,
        },
        data: {
          isEmailConfirmed: true,
          ...(!ticket.user.referralCode && {
            referralCode: await this._generateUniqueReferralCode(prisma),
          }),
        },
      })

      const accessToken = await this._generateAccessToken(ticket.userId)

      await prisma.token.create({
        data: {
          token: accessToken,
          user: {
            connect: {
              id: ticket.userId,
            },
          },
        },
      })

      if (!ticket.user.isEmailConfirmed) {
        this.sendDiscordWebhook(updatedUser, 'login-validation')
      }

      return {
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        referralCode: updatedUser.referralCode,
        accessToken,
        isFirstTimeConfirmation: !ticket.user.isEmailConfirmed,
      }
    })

    if (confirmedResult.isFirstTimeConfirmation) {
      await this.emailService.sendEmail(
        confirmedResult.email,
        'Selamat! Anda Sekarang Bagian dari Mutari!',
        this._thankYouTemplate(
          confirmedResult.name,
          confirmedResult.referralCode
        )
      )
    }

    return this.responseUtil.response(
      { statusCode: HttpStatus.OK, message: 'Validate ticket success!' },
      { email: confirmedResult.email, accessToken: confirmedResult.accessToken }
    )
  }

  private async _generateAccessToken(id: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '30m',
      }
    )

    return accessToken
  }

  async getReferralCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        referralCode: true,
        _count: {
          select: { referrals: true }, // Menghitung jumlah referrals
        },
      },
    })

    if (!user) throw new BadRequestException('User not found')
    return this.responseUtil.response(
      { statusCode: HttpStatus.OK, message: 'Success get Referral Code' },
      {
        user: {
          email: user.email,
          referralCode: user.referralCode,
          usedCount: user._count.referrals, // Jumlah orang yang menggunakan referral code ini
        },
      }
    )
  }

  async _generateTicket(prisma: Prisma.TransactionClient, userId: string) {
    const existedTickets = await prisma.ticket.findMany({
      where: {
        userId: userId,
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
          `Please wait ${Math.floor(timeLeft / 1000)} seconds before requesting another login link`
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

    const ticket = await prisma.ticket.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
      },
    })

    return ticket
  }

  private _emailConfirmationTemplate(ticketId: string) {
    return `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login ke Mutari</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .header img {
              max-width: 150px;
              margin: 20px auto;
            }
            h3 {
              color: #2c3e50;
            }
            p {
              color: #555;
              font-size: 16px;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              background: #007bff;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 20px;
            }
            .button:hover {
              background: #0056b3;
            }
            .referral-box {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            .footer {
              margin-top: 20px;
              font-size: 14px;
              color: #777;
            }
            .support {
              margin-top: 10px;
              font-size: 14px;
              color: #333;
            }
            .support a {
              color: #007bff;
              text-decoration: none;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://res.cloudinary.com/mutari/image/upload/logo-with-name.png" alt="Mutari Logo">
            </div>
            <h3>Masuk ke Akun Mutari</h3>
            <p>Klik tombol di bawah ini untuk masuk ke akun Mutari Anda.</p>
            <a href="${process.env.CLIENT_URL}?ticket=${ticketId}" class="button">Masuk Sekarang</a>
            <p>Link ini hanya berlaku selama <strong>${Number(process.env.PRE_REGISTER_TICKET_EXPIRES_IN) / 60000} menit</strong>.</p>
            <p>Jika Anda tidak meminta login, abaikan email ini.</p>

            <div class="support">
              <p>Butuh bantuan? Hubungi kami di <a href="mailto:support@mutari.id">support@mutari.id</a></p>
            </div>
            <div class="footer">
              <p>© 2025 Mutari</p>
            </div>
          </div>
        </body>
        </html>`
  }

  private _thankYouTemplate(name: string, referralCode: string) {
    return `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Terima Kasih telah Bergabung dengan Mutari!</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .header img {
              max-width: 150px;
              margin: 20px auto;
            }
            h3 {
              color: #2c3e50;
            }
            p {
              color: #555;
              font-size: 16px;
              line-height: 1.6;
            }
            .referral-box {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
              font-size: 16px;
              font-weight: bold;
              color: #333;
            }
            .button {
              display: inline-block;
              background: #007bff;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 5px;
              font-weight: bold;
              margin-top: 20px;
            }
            .button:hover {
              background: #0056b3;
            }
            .footer {
              margin-top: 20px;
              font-size: 14px;
              color: #777;
            }
            .support {
              margin-top: 10px;
              font-size: 14px;
              color: #333;
            }
            .support a {
              color: #007bff;
              text-decoration: none;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://res.cloudinary.com/mutari/image/upload/logo-with-name.png" alt="Mutari Logo">
            </div>
            <h3>Terima Kasih, ${name}, telah Bergabung dengan Mutari!</h3>
            <p>Selamat! Akun Anda telah berhasil dikonfirmasi.</p>
            <p>Jangan lupa untuk membagikan kode referral Anda kepada teman-teman agar mereka juga bisa menikmati pengalaman wisata yang lebih mudah dan menyenangkan.</p>
            
            <div class="referral-box">
              Kode Referral Anda: <strong>${referralCode}</strong>
            </div>

            <p>Gunakan kode ini untuk mendapatkan keuntungan khusus saat Anda menggunakan layanan Mutari.</p>

            <div class="support">
              <p>Butuh bantuan? Hubungi kami di <a href="mailto:support@mutari.id">support@mutari.id</a></p>
            </div>
            <div class="footer">
              <p>© 2025 Mutari</p>
            </div>
          </div>
        </body>
        </html>`
  }
}
