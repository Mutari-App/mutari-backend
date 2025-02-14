import { Test, TestingModule } from '@nestjs/testing'
import { PreRegisterService } from './pre-register.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { EmailService } from 'src/email/email.service'
import { JwtService } from '@nestjs/jwt'
import { ResponseUtil } from 'src/common/utils/response.util'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

describe('PreRegisterService', () => {
  let service: PreRegisterService
  let prisma: DeepMockProxy<PrismaClient>
  let emailService: EmailService
  let jwtService: JwtService
  let responseUtil: ResponseUtil

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreRegisterService,
        PrismaService,
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
          },
        },
        {
          provide: ResponseUtil,
          useValue: {
            response: jest.fn((status, data) => ({ status, ...data })),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(
        mockDeep<PrismaClient>({
          $transaction: jest
            .fn()
            .mockImplementation(async (callback) => await callback(prisma)),
        })
      )
      .compile()

    prisma = module.get(PrismaService)
    service = module.get<PreRegisterService>(PreRegisterService)
    emailService = module.get<EmailService>(EmailService)
    jwtService = module.get<JwtService>(JwtService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createPreRegister', () => {
    it('should create a new user and send confirmation email', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '08123456789',
        referralCode: 'REF123',
      }

      prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'REFERRED_USER_ID',
        referralCode: dto.referralCode?.toUpperCase(),
      } as any)

      prisma.user.create.mockResolvedValue({
        id: 'USER123',
        ...dto,
        updatedAt: new Date(),
        createdAt: new Date(),
        isEmailConfirmed: false,
        referredById: 'REFERRED_USER_ID',
      })

      jest.spyOn(service, '_generateTicket').mockResolvedValue({
        updatedAt: new Date(),
        createdAt: new Date(),
        id: 'id',
        userId: 'USER123',
      })

      const result = await service.createPreRegister(dto)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: dto.email }),
        })
      )

      expect(emailService.sendEmail).toHaveBeenCalled()

      expect(result).toEqual({
        status: {
          statusCode: 200,
          message: 'Pre-registration successful',
        },
        user: expect.any(Object),
      })
    })

    it('should throw BadRequestException if email is already registered', async () => {
      const dto: PreRegisterDTO = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '08123456789',
        referralCode: '',
      }

      prisma.user.findUnique.mockResolvedValue({
        id: 'USER123',
        email: dto.email,
        updatedAt: new Date(),
        createdAt: new Date(),
        firstName: '',
        lastName: '',
        phoneNumber: '',
        referralCode: '',
        isEmailConfirmed: false,
        referredById: null,
      })

      await expect(service.createPreRegister(dto)).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('getPreRegisterCount', () => {
    it('should return total pre-registered users count', async () => {
      prisma.user.count.mockResolvedValue(10)

      const result = await service.getPreRegisterCount()
      expect(result).toEqual({
        count: 10,
        status: {
          message: 'Total pre-registered users retrieved successfully.',
          statusCode: 200,
        },
      })
    })
  })

  describe('login', () => {
    it('should send login email if user exists', async () => {
      const email = 'test@example.com'
      prisma.user.findUnique.mockResolvedValue({
        id: 'USER123',
        email,
        updatedAt: undefined,
        createdAt: undefined,
        firstName: '',
        lastName: '',
        phoneNumber: '',
        referralCode: '',
        isEmailConfirmed: false,
        referredById: '',
      })
      jest.spyOn(service, '_generateTicket').mockResolvedValue({
        updatedAt: new Date(),
        createdAt: new Date(),
        id: 'id',
        userId: 'userId',
      })

      const result = await service.login(email)

      expect(emailService.sendEmail).toHaveBeenCalled()
      expect(result).toEqual({
        status: {
          statusCode: 200,
          message: 'Login email sent successfully',
        },
      })
    })

    it('should throw BadRequestException if email is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.login('test@example.com')).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('validateLogin', () => {
    it('should validate login ticket and return access token', async () => {
      const ticketId = 'TICKET123'

      prisma.ticket.findUnique.mockResolvedValue({
        createdAt: new Date(),
        userId: 'USER123',
        user: { referralCode: null, isEmailConfirmed: false },
      } as any)

      prisma.user.update.mockResolvedValue({
        id: 'USER123',
        email: 'test@example.com',
        referralCode: 'REF123',
      } as any)

      prisma.token.create.mockResolvedValue({
        token: 'mocked-jwt-token',
      } as any)

      const result = await service.validateLogin(ticketId)

      expect(result).toEqual(
        expect.objectContaining({
          status: {
            statusCode: 200,
            message: 'Validate ticket success!',
          },
          accessToken: 'mocked-jwt-token',
          email: 'test@example.com',
        })
      )
    })

    it('should throw UnauthorizedException for invalid or expired ticket', async () => {
      prisma.ticket.findUnique.mockResolvedValue(null)
      await expect(service.validateLogin('INVALID_TICKET')).rejects.toThrow(
        UnauthorizedException
      )
    })
  })

  describe('getReferralCode', () => {
    it('should return user referral code and count', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        referralCode: 'REF123',
        _count: { referrals: 3 },
      } as any)

      const result = await service.getReferralCode('USER123')
      expect(result).toEqual({
        status: {
          statusCode: 200,
          message: 'Success get Referral Code',
        },
        user: {
          email: 'test@example.com',
          referralCode: 'REF123',
          usedCount: 3,
        },
      })
    })

    it('should throw BadRequestException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(service.getReferralCode('INVALID_USER')).rejects.toThrow(
        BadRequestException
      )
    })
  })
})
