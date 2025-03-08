import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma/prisma.service'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { LoginDTO } from './dto/login.dto'
import { User } from '@prisma/client'

describe('AuthService', () => {
  let service: AuthService
  let prismaService: PrismaService
  let jwtService: JwtService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              deleteMany: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    prismaService = module.get<PrismaService>(PrismaService)
    jwtService = module.get<JwtService>(JwtService)

    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
    process.env.ACCESS_TOKEN_EXPIRES_IN = '1h'
    process.env.REFRESH_TOKEN_EXPIRES_IN = '30d'
  })

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null)
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      }

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should throw UnauthorizedException if password is invalid', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false))

      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      }

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should return access and refresh tokens if login is successful', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      })
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true))
      jwtService.signAsync = jest.fn().mockResolvedValue('testToken')

      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      }

      const result = await service.login(loginDto)

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { userId: 1 },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        }
      )

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { userId: 1 },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
        }
      )

      expect(result).toEqual({
        accessToken: 'testToken',
        refreshToken: 'testToken',
      })
    })
  })

  describe('refreshToken', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
    }

    it('should throw UnauthorizedException if refresh token is blacklisted', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true))

      prismaService.refreshToken.findFirst = jest.fn().mockResolvedValue({
        updatedAt: new Date(),
        createdAt: new Date(),
        id: 'idRefreshToken',
        userId: 'userId',
        token: 'refreshToken',
        expiresAt: new Date(),
      })

      await expect(
        service.refreshToken(
          mockUser as User,
          'invalid-refresh-token',
          new Date()
        )
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should return new access and refresh tokens if refresh token is valid', async () => {
      prismaService.refreshToken.findFirst = jest.fn().mockResolvedValue(null)
      jwtService.signAsync = jest.fn().mockResolvedValue('newToken')
      prismaService.refreshToken.create = jest.fn()

      const result = await service.refreshToken(
        mockUser as User,
        'valid-refresh-token',
        new Date()
      )

      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: 'valid-refresh-token',
          expiresAt: expect.any(Date),
          user: { connect: { id: mockUser.id } },
        },
      })

      expect(result).toEqual({
        accessToken: 'newToken',
        refreshToken: 'newToken',
      })
    })
  })

  describe('clearExpiredRefreshTokens', () => {
    it('should delete expired refresh tokens', async () => {
      await service.clearExpiredRefreshTokens()
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lte: expect.any(Date),
          },
        },
      })
    })
  })
})
