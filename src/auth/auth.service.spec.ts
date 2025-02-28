import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { EmailService } from 'src/email/email.service'
import { BadRequestException, ConflictException } from '@nestjs/common'
import { CreateUserDTO } from './dto/create-user-dto'
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
})
