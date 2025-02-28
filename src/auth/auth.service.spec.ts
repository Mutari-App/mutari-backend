import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { EmailService } from 'src/email/email.service'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { CreateUserDTO } from './dto/create-user-dto'
import { VerifyRegistrationDTO } from './dto/verify-registration-dto'
import { RegisterDTO } from './dto/register-dto'
import { newUserRegistrationTemplate } from './templates/new-user-registration-template'
import { verificationCodeTemplate } from './templates/verification-code-template'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient, Ticket, User } from '@prisma/client'

describe('AuthService', () => {
  let service: AuthService
  let prisma: DeepMockProxy<PrismaClient>
  let emailService: EmailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaService,
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
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
    service = module.get<AuthService>(AuthService)
    emailService = module.get<EmailService>(EmailService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createUser', () => {
    it('should throw ConflictException if user already exists and is confirmed', async () => {
      prisma.user.findUnique.mockResolvedValue({
        isEmailConfirmed: true,
        updatedAt: new Date(),
        createdAt: new Date(),
        id: 'USER123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '012345678910',
        password: 'password',
        photoProfile: 'photo.png',
        birthDate: new Date(),
        referralCode: '',
        referredById: '',
        loyaltyPoints: 0,
      })

      await expect(
        service.createUser({ email: 'john.doe@example.com' } as CreateUserDTO)
      ).rejects.toThrow(ConflictException)
    })

    it('should throw BadRequestException if user was created recently and is not confirmed', async () => {
      const createdAt = new Date()
      prisma.user.findUnique.mockResolvedValue({
        isEmailConfirmed: false,
        createdAt,
        updatedAt: undefined,
        id: '',
        firstName: '',
        lastName: '',
        email: 'test@example.com',
        phoneNumber: '',
        password: '',
        photoProfile: '',
        birthDate: undefined,
        referralCode: '',
        referredById: '',
        loyaltyPoints: 0,
      })

      jest
        .spyOn(global.Date, 'now')
        .mockImplementationOnce(() => createdAt.getTime() + 4 * 60 * 1000)

      await expect(
        service.createUser({ email: 'test@example.com' } as CreateUserDTO)
      ).rejects.toThrow(BadRequestException)
    })

    it('should create a new user if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        email: 'test@example.com',
      } as any)

      await service.createUser({
        email: 'test@example.com',
      } as CreateUserDTO)

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com' },
      })
    })
  })

  describe('sendVerification', () => {
    it('should throw BadRequestException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.sendVerification({ email: 'test@example.com' } as CreateUserDTO)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException if requesting too fast', async () => {
      const user = {
        id: 'user-id',
        firstName: 'John',
        email: 'test@example.com',
      } as User

      const createdAt = new Date()
      prisma.user.findUnique.mockResolvedValue(user)
      prisma.ticket.findMany.mockResolvedValue([
        {
          createdAt,
          id: 'ticket-id',
          uniqueCode: 'verification-code',
          userId: 'user-id',
          updatedAt: undefined,
        },
      ])

      jest
        .spyOn(global.Date, 'now')
        .mockImplementationOnce(() => createdAt.getTime() + 1000)

      await expect(
        service.sendVerification({ email: 'test@example.com' } as CreateUserDTO)
      ).rejects.toThrow(BadRequestException)
    })

    it('should delete the oldest ticket if there are too many', async () => {
      const user = {
        id: 'user-id',
        firstName: 'John',
        email: 'test@example.com',
      } as User

      const now = Date.now()
      const tickets = Array.from({ length: 5 }, (_, i) => ({
        createdAt: new Date(now - (i + 1) * 60000 * 31),
        id: `ticket-id-${i}`,
        uniqueCode: `verification-code-${i}`,
        userId: 'user-id',
      })) as Ticket[]

      prisma.user.findUnique.mockResolvedValue(user)
      prisma.ticket.findMany.mockResolvedValue(tickets)
      prisma.ticket.create.mockResolvedValue({
        uniqueCode: 'new-verification-code',
        createdAt: new Date(now + 60000 * 31),
        id: 'new-ticket-id',
        userId: 'user-id',
        updatedAt: undefined,
      })

      await service.sendVerification({
        email: 'test@example.com',
      } as CreateUserDTO)

      expect(prisma.ticket.delete).toHaveBeenCalledWith({
        where: { id: 'ticket-id-4' },
      })
    })

    it('should send verification email if user exists', async () => {
      const user = {
        id: 'user-id',
        firstName: 'John',
        email: 'test@example.com',
      } as User

      prisma.user.findUnique.mockResolvedValue(user)
      prisma.ticket.findMany.mockResolvedValue([])
      prisma.ticket.create.mockResolvedValue({
        uniqueCode: 'verification-code',
        updatedAt: undefined,
        createdAt: undefined,
        id: '',
        userId: '',
      })

      await service.sendVerification({
        email: 'test@example.com',
      } as CreateUserDTO)

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Your Mutari Verification Code',
        verificationCodeTemplate('John', 'verification-code')
      )
    })
  })

  describe('verify', () => {
    it('should throw NotFoundException if verification code is not found', async () => {
      prisma.ticket.findUnique.mockResolvedValue(null)

      await expect(
        service.verify({
          verificationCode: 'code',
          email: 'test@example.com',
          firstName: 'John',
        } as VerifyRegistrationDTO)
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw UnauthorizedException if emails do not match', async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        uniqueCode: 'verification-code',
        updatedAt: undefined,
        createdAt: undefined,
        id: '',
        user: {
          email: 'wrong@example.com',
          firstName: 'Jane',
          updatedAt: undefined,
        } as any,
      } as any)

      await expect(
        service.verify({
          verificationCode: 'code',
          email: 'test@example.com',
          firstName: 'John',
        } as VerifyRegistrationDTO)
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException if firstNames do not match', async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        uniqueCode: 'verification-code',
        updatedAt: undefined,
        createdAt: undefined,
        id: '',
        user: {
          email: 'test@example.com',
          firstName: 'Jane',
          updatedAt: undefined,
        } as any,
      } as any)

      await expect(
        service.verify({
          verificationCode: 'code',
          email: 'test@example.com',
          firstName: 'John',
        } as VerifyRegistrationDTO)
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('register', () => {
    it('should throw BadRequestException if passwords do not match', async () => {
      jest.spyOn(service, 'verify').mockResolvedValue(undefined)
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'pass',
          confirmPassword: 'wrong',
        } as RegisterDTO)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(service, 'verify').mockResolvedValue(undefined)
      prisma.user.findUnique.mockResolvedValue(null)
      await expect(
        service.register({
          email: 'none@example.com',
          password: 'pass',
          confirmPassword: 'pass',
        } as RegisterDTO)
      ).rejects.toThrow(NotFoundException)
    })

    it('should update user and send registration email if verification is successful', async () => {
      jest.spyOn(service, 'verify').mockResolvedValue(undefined)
      prisma.user.findUnique.mockResolvedValue({
        email: 'test@example.com',
        firstName: 'John',
        id: 'USER-ID',
      } as any)
      prisma.user.update.mockResolvedValue({
        email: 'test@example.com',
        firstName: 'John',
        updatedAt: undefined,
        createdAt: undefined,
        id: '',
        lastName: '',
        phoneNumber: '',
        password: 'hashedPassword',
        photoProfile: '',
        birthDate: undefined,
        referralCode: '',
        isEmailConfirmed: false,
        referredById: '',
        loyaltyPoints: 0,
      })

      await service.register({
        email: 'test@example.com',
        password: 'pass',
        confirmPassword: 'pass',
        firstName: 'John',
      } as RegisterDTO)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { password: 'hashedPassword', isEmailConfirmed: true },
      })

      expect(prisma.ticket.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'USER-ID' },
      })

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Register Successful!',
        newUserRegistrationTemplate('John')
      )
    })
  })
})
