import {
  BadRequestException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { ResponseUtil } from 'src/common/utils/response.util'
import { customAlphabet } from 'nanoid'
import { EmailService } from 'src/email/email.service'
import { JwtService } from '@nestjs/jwt'

const generatedReferralCode = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8
)

@Injectable()
export class PreRegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly responseUtil: ResponseUtil,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService
  ) {}

  _generateReferralCode() {
    return generatedReferralCode()
  }

  async createPreRegister(preRegisterDto: PreRegisterDTO) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: preRegisterDto.email },
    })

    if (existingUser) {
      throw new BadRequestException(
        'The email is already registered. Please use a different email.'
      )
    }

    const referredUser = await this.prisma.user.findUnique({
      where: { referralCode: preRegisterDto.referralCode.toUpperCase() },
    })

    let referralCode: string
    let isDuplicate: boolean

    do {
      referralCode = this._generateReferralCode()
      const existingReferral = await this.prisma.user.findUnique({
        where: { referralCode },
      })
      isDuplicate = !!existingReferral
    } while (isDuplicate)

    const user = await this.prisma.user.create({
      data: {
        email: preRegisterDto.email,
        firstName: preRegisterDto.firstName,
        lastName: preRegisterDto.lastName,
        phoneNumber: preRegisterDto.phoneNumber,
        city: preRegisterDto.city,
        country: preRegisterDto.country,
        referralCode: referralCode.toUpperCase(),
        ...(!!referredUser && {
          referredBy: {
            connect: {
              id: referredUser.id,
            },
          },
        }),
      },
    })
    return this.responseUtil.response(
      {
        code: HttpStatus.OK,
        message: 'Pre-registration successful',
      },
      { user }
    )
  }

  async getPreRegisterCount() {
    const count = await this.prisma.user.count({})
    return this.responseUtil.response(
      {
        code: HttpStatus.OK,
        message: 'Total pre-registered users retrieved successfully.',
      },
      { count }
    )
  }

  async login(email: string) {
    return await this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { email },
      })
      if (!user) throw new BadRequestException('Email is not registered.')

      const existedTokens = await prisma.token.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const latestExistedToken = existedTokens[0]

      if (!!latestExistedToken) {
        const createdAt = new Date(latestExistedToken.createdAt)
        const timeDiff = new Date().getTime() - createdAt.getTime()
        const timeLeft =
          Number(process.env.PRE_REGISTER_TOKEN_REQUEST_DELAY) - timeDiff
        if (timeLeft > 0)
          throw new BadRequestException(
            `Please wait ${Math.floor(timeLeft / 1000)} seconds before requesting another login link`
          )
      }

      if (existedTokens.length >= 5) {
        const lastExistedToken = existedTokens[existedTokens.length - 1]
        await prisma.token.delete({
          where: {
            id: lastExistedToken.id,
          },
        })
      }

      const token = await prisma.token.create({
        data: {
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      })

      await this.emailService.sendEmail(
        email,
        'Your Mutari Login Link',
        `<!DOCTYPE html>
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
            <a href="${process.env.CLIENT_URL}/pre-register/validate/${token.id}" class="button">Masuk Sekarang</a>
            <p>Link ini hanya berlaku selama <strong>${Number(process.env.PRE_REGISTER_TOKEN_EXPIRES_IN) / 60000} menit</strong>.</p>
            <p>Jika Anda tidak meminta login, abaikan email ini.</p>
            <div class="support">
              <p>Butuh bantuan? Hubungi kami di <a href="mailto:support@mutari.id">support@mutari.id</a></p>
            </div>
            <div class="footer">
              <p>© 2024 Mutari</p>
            </div>
          </div>
        </body>
        </html>`
      )
      return this.responseUtil.response({
        code: HttpStatus.OK,
        message: 'Login email sent successfully',
      })
    })
  }

  async validateLogin(tokenId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const token = await prisma.token.findUnique({
        where: {
          id: tokenId,
        },
      })

      if (!token)
        throw new UnauthorizedException('Invalid or expired login token.')

      const timeDiff = new Date().getTime() - token.createdAt.getTime()
      if (timeDiff > Number(process.env.PRE_REGISTER_TOKEN_EXPIRES_IN))
        throw new UnauthorizedException('Invalid or expired login token.')

      await prisma.token.deleteMany({
        where: { userId: token.userId },
      })

      const accessToken = await this._generateAccessToken(token.userId)

      return this.responseUtil.response(
        { code: HttpStatus.OK, message: '' },
        { accessToken }
      )
    })
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
}
