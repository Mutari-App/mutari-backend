import { Test, TestingModule } from '@nestjs/testing'
import { ProfileService } from './profile.service'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { EmailService } from 'src/email/email.service'
import { User } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

describe('ProfileService', () => {
  let service: ProfileService
  let prismaService: PrismaService
  let emailService: EmailService

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    itinerary: {
      findMany: jest.fn(),
    },
    itineraryLike: {
      findMany: jest.fn(),
    },
    changeEmailTicket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
  }

  const mockEmailService = {
    sendEmail: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile()

    service = module.get<ProfileService>(ProfileService)
    prismaService = module.get<PrismaService>(PrismaService)
    emailService = module.get<EmailService>(EmailService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOne', () => {
    it('should return a user profile by id', async () => {
      // Arrange
      const id = '123'
      const mockUser = {
        id,
        photoProfile: 'avatar.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        _count: {
          referrals: 2,
          itineraries: 1,
        },
        loyaltyPoints: 50,
        itineraries: [
          {
            _count: {
              likes: 5,
            },
          },
        ],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
        select: expect.objectContaining({
          id: true,
          photoProfile: true,
          firstName: true,
          lastName: true,
          referralCode: true,
          loyaltyPoints: true,
        }),
      })
      expect(result).toEqual({
        id,
        photoProfile: 'avatar.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        loyaltyPoints: 50,
        totalReferrals: 2,
        totalItineraries: 1,
        totalLikes: 5,
      })
    })

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      const id = 'nonexistent-id'
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`User with id ${id} not found`)
      )
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id },
        })
      )
    })

    it('should calculate totalLikes from itineraries correctly', async () => {
      // Arrange
      const id = '123'
      const mockUser = {
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        _count: {
          referrals: 5,
          itineraries: 2,
        },
        loyaltyPoints: 100,
        itineraries: [
          {
            _count: {
              likes: 10,
            },
          },
          {
            _count: {
              likes: 15,
            },
          },
        ],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(result.totalLikes).toBe(25)
      expect(result).toEqual({
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        loyaltyPoints: 100,
        totalReferrals: 5,
        totalItineraries: 2,
        totalLikes: 25,
      })
    })

    it('should handle user with no itineraries', async () => {
      // Arrange
      const id = '123'
      const mockUser = {
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        _count: {
          referrals: 0,
          itineraries: 0,
        },
        loyaltyPoints: 0,
        itineraries: [],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(result).toEqual({
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        loyaltyPoints: 0,
        totalReferrals: 0,
        totalItineraries: 0,
        totalLikes: 0,
      })
    })
  })
  describe('getListItineraries', () => {
    it('should return a list of itineraries for a user', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraries = [
        {
          id: 'itinerary1',
          title: 'Paris Trip',
          description: 'City of Lights',
          coverImage: 'paris.jpg',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-06-07'),
          _count: { likes: 12 },
          sections: [{ _count: { blocks: 3 } }, { _count: { blocks: 2 } }],
        },
        {
          id: 'itinerary2',
          title: 'Rome Weekend',
          description: 'Italian getaway',
          coverImage: 'rome.jpg',
          startDate: new Date('2023-07-15'),
          endDate: new Date('2023-07-17'),
          _count: { likes: 8 },
          sections: [{ _count: { blocks: 4 } }],
        },
      ]

      mockPrismaService.itinerary.findMany.mockResolvedValue(mockItineraries)

      // Act
      const result = await service.getListItineraries(userId)

      // Assert
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'itinerary1',
        title: 'Paris Trip',
        description: 'City of Lights',
        coverImage: 'paris.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 12,
        totalDestinations: 5,
      })
      expect(result[1]).toEqual({
        id: 'itinerary2',
        title: 'Rome Weekend',
        description: 'Italian getaway',
        coverImage: 'rome.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 8,
        totalDestinations: 4,
      })

      // Verify no sections in the result
      expect(result[0]).not.toHaveProperty('sections')
      expect(result[1]).not.toHaveProperty('_count')
    })

    it('should handle user with no itineraries', async () => {
      // Arrange
      const userId = 'user123'
      mockPrismaService.itinerary.findMany.mockResolvedValue([])

      // Act
      const result = await service.getListItineraries(userId)

      // Assert
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      })
      expect(result).toEqual([])
    })

    it('should correctly calculate totalDestinations when sections is empty', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraries = [
        {
          id: 'itinerary1',
          title: 'Empty Trip',
          description: 'No destinations yet',
          coverImage: 'empty.jpg',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-06-07'),
          _count: { likes: 3 },
          sections: [], // Empty sections
        },
      ]

      mockPrismaService.itinerary.findMany.mockResolvedValue(mockItineraries)

      // Act
      const result = await service.getListItineraries(userId)

      // Assert
      expect(result[0].totalDestinations).toBe(0)
      expect(result[0].totalLikes).toBe(3)
    })
  })

  describe('getListItineraryLikes', () => {
    it('should return a list of liked itineraries for a user', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraryLikes = [
        {
          itinerary: {
            id: 'itinerary1',
            title: 'Mountain Retreat',
            description: 'Peaceful getaway',
            coverImage: 'mountain.jpg',
            startDate: new Date('2023-08-10'),
            endDate: new Date('2023-08-15'),
            _count: { likes: 20 },
            sections: [{ _count: { blocks: 2 } }, { _count: { blocks: 3 } }],
          },
        },
        {
          itinerary: {
            id: 'itinerary2',
            title: 'Beach Vacation',
            description: 'Sun and sand',
            coverImage: 'beach.jpg',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-09-10'),
            _count: { likes: 15 },
            sections: [{ _count: { blocks: 4 } }],
          },
        },
      ]

      mockPrismaService.itineraryLike.findMany.mockResolvedValue(
        mockItineraryLikes
      )

      // Act
      const result = await service.getListItineraryLikes(userId)

      // Assert
      expect(mockPrismaService.itineraryLike.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'itinerary1',
        title: 'Mountain Retreat',
        description: 'Peaceful getaway',
        coverImage: 'mountain.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 20,
        totalDestinations: 5,
      })
      expect(result[1]).toEqual({
        id: 'itinerary2',
        title: 'Beach Vacation',
        description: 'Sun and sand',
        coverImage: 'beach.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 15,
        totalDestinations: 4,
      })

      // Verify no sections in the result
      expect(result[0]).not.toHaveProperty('sections')
      expect(result[1]).not.toHaveProperty('_count')
    })

    it('should handle user with no liked itineraries', async () => {
      // Arrange
      const userId = 'user123'
      mockPrismaService.itineraryLike.findMany.mockResolvedValue([])

      // Act
      const result = await service.getListItineraryLikes(userId)

      // Assert
      expect(mockPrismaService.itineraryLike.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual([])
    })

    it('should correctly calculate totalDestinations when sections is empty', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraryLikes = [
        {
          itinerary: {
            id: 'itinerary1',
            title: 'Empty Trip',
            description: 'No destinations yet',
            coverImage: 'empty.jpg',
            startDate: new Date('2023-06-01'),
            endDate: new Date('2023-06-07'),
            _count: { likes: 2 },
            sections: [], // Empty sections
          },
        },
      ]

      mockPrismaService.itineraryLike.findMany.mockResolvedValue(
        mockItineraryLikes
      )

      // Act
      const result = await service.getListItineraryLikes(userId)

      // Assert
      expect(result[0].totalDestinations).toBe(0)
      expect(result[0].totalLikes).toBe(2)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile with valid data', async () => {
      // Arrange
      const userId = 'user123'
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        photoProfile: 'new-avatar.jpg',
      }

      const mockUpdatedUser = {
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        photoProfile: 'new-avatar.jpg',
        email: 'jane@example.com',
      }

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser)

      // Act
      const result = await service.updateProfile(userId, updateData)

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: mockUpdatedUser.firstName,
          lastName: mockUpdatedUser.lastName,
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
      expect(result).toEqual(mockUpdatedUser)
    })

    it('should only update specified fields', async () => {
      // Arrange
      const userId = 'user123'
      const updateData = {
        firstName: 'John',
      }

      const mockUpdatedUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe', // unchanged
        photoProfile: 'profile.jpg',
        email: 'john@example.com',
      }

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser)

      // Act
      const result = await service.updateProfile(userId, updateData)

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: updateData.firstName,
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
      expect(result).toEqual(mockUpdatedUser)
    })
  })

  describe('sendVerificationCode', () => {
    it('should successfully generate and send verification code', async () => {
      // Arrange
      const mockUpdateUser = {
        id: 'user123',
        email: 'current@example.com',
        firstName: 'John',
      } as User
      const newEmail = 'new@example.com'

      // Mock the verification code generation
      const mockVerificationCode = {
        id: 'ticket123',
        uniqueCode: 'ABC12345',
        userId: mockUpdateUser.id,
        newEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      jest
        .spyOn(service, '_generateChangeEmailTicket')
        .mockResolvedValue(mockVerificationCode)

      // Mock PrismaService
      mockPrismaService.user.findUnique.mockResolvedValue(null) // No existing user with this email

      // Act
      await service.sendVerificationCode(mockUpdateUser, newEmail)

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: newEmail },
      })
      expect(service._generateChangeEmailTicket).toHaveBeenCalledWith(
        mockUpdateUser.id,
        newEmail
      )
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        newEmail,
        'Verifikasi Perubahan Email - Mutari',
        expect.any(String)
      )
    })

    it('should throw BadRequestException if email is the same as current email', async () => {
      // Arrange
      const user = {
        id: 'user123',
        email: 'current@example.com',
        firstName: 'John',
      } as User

      // Act & Assert
      await expect(
        service.sendVerificationCode(user, user.email)
      ).rejects.toThrow(
        new BadRequestException('Email is the same as current email')
      )

      // Verify that no other methods were called
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException if email is already in use', async () => {
      // Arrange
      const user = {
        id: 'user123',
        email: 'current@example.com',
        firstName: 'John',
      } as User
      const existingEmail = 'existing@example.com'

      // Mock finding an existing user with the email
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'otherUser456',
        email: existingEmail,
      })

      // Act & Assert
      await expect(
        service.sendVerificationCode(user, existingEmail)
      ).rejects.toThrow(new BadRequestException('Email already in use'))

      // Verify prisma was called correctly
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: existingEmail },
      })
    })
  })

  describe('_generateChangeEmailTicket', () => {
    process.env.PRE_REGISTER_TICKET_REQUEST_DELAY = '5000'

    it('should successfully generate a change email ticket', async () => {
      // Arrange
      const userId = 'user123'
      const newEmail = 'new@example.com'
      const mockTicket = {
        id: 'ticket123',
        uniqueCode: 'ABC12345',
        userId,
        newEmail,
        createdAt: new Date(),
      }

      // Mock the _generateVerificationCode method
      jest
        .spyOn(service, '_generateVerificationCode')
        .mockReturnValue('ABC12345')

      mockPrismaService.changeEmailTicket.findMany.mockResolvedValue([])
      mockPrismaService.changeEmailTicket.findUnique.mockResolvedValue(null)
      mockPrismaService.changeEmailTicket.create.mockResolvedValue(mockTicket)

      // Act
      const result = await service._generateChangeEmailTicket(userId, newEmail)

      // Assert
      expect(mockPrismaService.changeEmailTicket.findMany).toHaveBeenCalledWith(
        {
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }
      )
      expect(service._generateVerificationCode).toHaveBeenCalled()
      expect(mockPrismaService.changeEmailTicket.create).toHaveBeenCalledWith({
        data: {
          newEmail,
          uniqueCode: 'ABC12345',
          user: {
            connect: { id: userId },
          },
        },
      })
      expect(result).toEqual(mockTicket)
    })

    it('should throw BadRequestException when requesting too soon', async () => {
      // Arrange
      const userId = 'user123'
      const newEmail = 'new@example.com'
      const now = new Date()
      const recentDate = new Date(now.getTime() - 60000) // 1 minute ago

      const mockTicket = {
        id: 'ticket123',
        uniqueCode: 'ABC12345',
        userId,
        newEmail,
        createdAt: recentDate,
      }

      mockPrismaService.changeEmailTicket.findMany.mockResolvedValue([
        mockTicket,
      ])

      // Mock environment variable
      const originalEnv = process.env.PRE_REGISTER_TICKET_REQUEST_DELAY
      process.env.PRE_REGISTER_TICKET_REQUEST_DELAY = '300000' // 5 minutes

      // Act & Assert
      await expect(
        service._generateChangeEmailTicket(userId, newEmail)
      ).rejects.toThrow(BadRequestException)

      // Cleanup
      process.env.PRE_REGISTER_TICKET_REQUEST_DELAY = originalEnv
    })

    it('should delete oldest ticket when there are 5 or more existing tickets', async () => {
      process.env.PRE_REGISTER_TICKET_REQUEST_DELAY = '0'

      // Arrange
      const userId = 'user123'
      const newEmail = 'new@example.com'

      // Create 5 mock tickets with different dates
      const mockTickets = Array.from({ length: 5 }, (_, i) => ({
        id: `ticket${i}`,
        uniqueCode: `CODE${i}`,
        userId,
        newEmail,
        createdAt: new Date(Date.now() - i * 3600000), // each 1 hour older
      }))

      mockPrismaService.changeEmailTicket.findMany.mockResolvedValue(
        mockTickets
      )
      mockPrismaService.changeEmailTicket.findUnique.mockResolvedValue(null)
      mockPrismaService.changeEmailTicket.create.mockResolvedValue({
        id: 'newTicket',
        uniqueCode: 'ABC12345',
        userId,
        newEmail,
        createdAt: new Date(),
      })

      // Act
      await service._generateChangeEmailTicket(userId, newEmail)

      // Assert
      expect(mockPrismaService.changeEmailTicket.delete).toHaveBeenCalledWith({
        where: { id: mockTickets[4].id },
      })
    })
  })

  describe('_verifyChangeEmailTicket', () => {
    it('should successfully verify a valid ticket', async () => {
      // Arrange
      const verificationCode = 'VALID123'
      const userId = 'user123'
      const newEmail = 'new@example.com'

      const mockTicket = {
        id: 'ticket123',
        uniqueCode: verificationCode,
        newEmail,
        user: {
          id: userId,
        },
      }

      mockPrismaService.changeEmailTicket.findUnique.mockResolvedValue(
        mockTicket
      )
      mockPrismaService.changeEmailTicket.deleteMany.mockResolvedValue({
        count: 1,
      })

      // Act
      const result = await service._verifyChangeEmailTicket(
        verificationCode,
        userId
      )

      // Assert
      expect(
        mockPrismaService.changeEmailTicket.findUnique
      ).toHaveBeenCalledWith({
        where: { uniqueCode: verificationCode },
        include: { user: true },
      })
      expect(
        mockPrismaService.changeEmailTicket.deleteMany
      ).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(result).toBe(newEmail)
    })

    it('should throw NotFoundException when ticket is not found', async () => {
      // Arrange
      const verificationCode = 'INVALID123'
      const userId = 'user123'

      mockPrismaService.changeEmailTicket.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service._verifyChangeEmailTicket(verificationCode, userId)
      ).rejects.toThrow(NotFoundException)

      expect(
        mockPrismaService.changeEmailTicket.deleteMany
      ).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when ticket does not belong to the user', async () => {
      // Arrange
      const verificationCode = 'VALID123'
      const userId = 'user123'
      const wrongUserId = 'user456'

      const mockTicket = {
        id: 'ticket123',
        uniqueCode: verificationCode,
        newEmail: 'new@example.com',
        user: {
          id: wrongUserId, // Different from userId
        },
      }

      mockPrismaService.changeEmailTicket.findUnique.mockResolvedValue(
        mockTicket
      )

      // Act & Assert
      await expect(
        service._verifyChangeEmailTicket(verificationCode, userId)
      ).rejects.toThrow(UnauthorizedException)

      expect(
        mockPrismaService.changeEmailTicket.deleteMany
      ).not.toHaveBeenCalled()
    })
  })
  describe('verifyEmailChange', () => {
    it('should successfully change user email after verification', async () => {
      // Arrange
      const user = {
        id: 'user123',
        email: 'old@example.com',
        firstName: 'John',
      } as User
      const code = 'VALID123'
      const newEmail = 'new@example.com'

      // Mock _verifyChangeEmailTicket to return the new email
      jest
        .spyOn(service, '_verifyChangeEmailTicket')
        .mockResolvedValue(newEmail)
      mockPrismaService.user.update.mockResolvedValue({
        ...user,
        email: newEmail,
      })

      // Act
      await service.verifyEmailChange(user, code)

      // Assert
      expect(service._verifyChangeEmailTicket).toHaveBeenCalledWith(
        code,
        user.id
      )
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { email: newEmail },
      })
    })

    it('should propagate errors from _verifyChangeEmailTicket', async () => {
      // Arrange
      const user = {
        id: 'user123',
        email: 'old@example.com',
        firstName: 'John',
      } as User
      const code = 'INVALID123'

      // Mock _verifyChangeEmailTicket to throw an error
      jest
        .spyOn(service, '_verifyChangeEmailTicket')
        .mockRejectedValue(new NotFoundException('Verification code not found'))

      // Act & Assert
      await expect(service.verifyEmailChange(user, code)).rejects.toThrow(
        NotFoundException
      )
      expect(service._verifyChangeEmailTicket).toHaveBeenCalledWith(
        code,
        user.id
      )
      expect(mockPrismaService.user.update).not.toHaveBeenCalled()
    })
  })
  describe('changePassword', () => {
    it('should throw UnauthorizedException when old password is correct', async () => {
      // Arrange
      const userId = 'user123'
      const changePasswordDto = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }

      const mockUser = {
        id: userId,
        password: 'hashed_old_password',
      }

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false))

      // Act & Assert
      await expect(
        service.changePassword(userId, changePasswordDto)
      ).rejects.toThrow(new UnauthorizedException('Old password is incorrect'))

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })

      expect(mockPrismaService.user.update).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when new password and confirmation do not match', async () => {
      // Arrange
      const userId = 'user123'
      const changePasswordDto = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'differentPassword',
      }

      const mockUser = {
        id: userId,
        password: 'hashed_old_password',
      }

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true))

      // Act & Assert
      await expect(
        service.changePassword(userId, changePasswordDto)
      ).rejects.toThrow(
        new BadRequestException('New password and confirmation do not match')
      )

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(mockPrismaService.user.update).not.toHaveBeenCalled()
    })

    it('should successfully change password when all validations pass', async () => {
      // Arrange
      const userId = 'user123'
      const changePasswordDto = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }

      const mockUser = {
        id: userId,
        password: 'hashed_old_password',
      }

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true))
      jest.spyOn(bcrypt, 'genSaltSync').mockImplementation(() => 'some_salt')
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('new_hashed_password'))

      // Act
      await service.changePassword(userId, changePasswordDto)

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'new_hashed_password' },
      })
    })

    it('should handle user not found', async () => {
      // Arrange
      const userId = 'nonexistent-user'
      const changePasswordDto = {
        oldPassword: 'oldPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }

      mockPrismaService.user.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(
        service.changePassword(userId, changePasswordDto)
      ).rejects.toThrow()
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(mockPrismaService.user.update).not.toHaveBeenCalled()
    })

    it('should throw BadRequestException when new password is same as old password', async () => {
      // Arrange
      const userId = 'user123'
      const changePasswordDto = {
        oldPassword: 'samePassword123',
        newPassword: 'samePassword123', // Same as oldPassword
        confirmPassword: 'samePassword123',
      }

      const mockUser = {
        id: userId,
        password: 'hashed_old_password',
      }

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true))

      // Act & Assert
      await expect(
        service.changePassword(userId, changePasswordDto)
      ).rejects.toThrow(
        new BadRequestException('New password cannot be the same as old')
      )

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(mockPrismaService.user.update).not.toHaveBeenCalled()
    })
  })
})
