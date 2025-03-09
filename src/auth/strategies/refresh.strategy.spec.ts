import { Test, TestingModule } from '@nestjs/testing'
import { extractTokenFromCookies, RefreshStrategy } from './refresh.strategy'
import { PrismaService } from 'src/prisma/prisma.service'
import { UnauthorizedException } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { ExtractJwt } from 'passport-jwt'
import { Request } from 'express'

describe('RefreshStrategy', () => {
  let refreshStrategy: RefreshStrategy
  let prisma: PrismaService

  beforeAll(() => {
    process.env.JWT_REFRESH_SECRET = 'JWT_REFRESH_SECRET'
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        RefreshStrategy,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile()

    refreshStrategy = module.get<RefreshStrategy>(RefreshStrategy)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(RefreshStrategy).toBeDefined()
  })

  it('should extract refresh token from cookies', () => {
    const mockRequest = {
      cookies: { refreshToken: 'mock_refresh_token' },
    }

    // Ambil fungsi ekstraksi dari konfigurasi strategi
    const extractJwt = ExtractJwt.fromExtractors([
      (req: Request) => req.cookies.refreshToken,
    ])

    const token = extractJwt(mockRequest as unknown as Request)

    expect(token).toBe('mock_refresh_token')
  })
  it('should validate user if refresh token is valid', async () => {
    const mockPayload = {
      userId: 'userId',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } // Token valid (berlaku 1 jam)
    const mockUser = { id: 'userId', firstName: 'John Doe' }

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as User)

    const result = await refreshStrategy.validate(mockPayload)

    expect(result).toEqual({
      user: mockUser,
      refreshTokenExpiresAt: new Date(mockPayload.exp * 1000),
    })
  })

  it('should throw UnauthorizedException if user not found', async () => {
    process.env.JWT_REFRESH_SECRET = 'JWT_REFRESH_SECRET'
    const mockPayload = {
      userId: 'userId',
      exp: Math.floor(Date.now() / 1000) + 3600,
    } // Token valid

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)

    await expect(refreshStrategy.validate(mockPayload)).rejects.toThrow(
      new UnauthorizedException('Invalid Token')
    )
  })

  it('should extract refresh token from cookies', () => {
    const mockRequest = {
      cookies: { refreshToken: 'mock_refresh_token' },
    }

    const extractedToken = extractTokenFromCookies(
      mockRequest as unknown as Request
    )

    expect(extractedToken).toBe('mock_refresh_token')
  })
})
