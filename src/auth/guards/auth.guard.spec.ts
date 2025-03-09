import { ExecutionContext } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { JwtService, TokenExpiredError } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from './auth.guard'
import { PrismaService } from 'src/prisma/prisma.service'
import { UnauthorizedException } from '@nestjs/common'
import { User } from '@prisma/client'

describe('AuthGuard', () => {
  let authGuard: AuthGuard
  let jwtService: JwtService
  let reflector: Reflector
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        JwtService,
        Reflector,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile()

    authGuard = module.get<AuthGuard>(AuthGuard)
    jwtService = module.get<JwtService>(JwtService)
    reflector = module.get<Reflector>(Reflector)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(authGuard).toBeDefined()
  })
  it('should allow access if the route is public', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true)

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext

    const result = await authGuard.canActivate(context)
    expect(result).toBe(true)
  })
  it('should throw UnauthorizedException if token is not provided', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ cookies: {} }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('token not provided')
    )
  })
  it('should throw UnauthorizedException if token is invalid', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('Invalid Token')
    })

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest
          .fn()
          .mockReturnValue({ cookies: { accessToken: 'invalid_token' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid Token')
    )
  })
  it('should throw UnauthorizedException if token has expired', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new UnauthorizedException('token has expired')
    })

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest
          .fn()
          .mockReturnValue({ cookies: { accessToken: 'expired_token' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('token has expired')
    )
  })
  it('should throw UnauthorizedException if user not found', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    jest.spyOn(jwtService, 'verify').mockReturnValue({ userId: 1 })
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null)

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest
          .fn()
          .mockReturnValue({ cookies: { accessToken: 'valid_token' } }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid Token')
    )
  })
  it('should allow access if token is valid', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    jest.spyOn(jwtService, 'verify').mockReturnValue({ userId: 1 })
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'userId',
      firstName: 'John Doe',
      password: 'hashed',
    } as User)

    const mockRequest = { cookies: { accessToken: 'valid_token' } }

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext

    const result = await authGuard.canActivate(context)
    expect(result).toBe(true)
    expect(mockRequest['user']).toEqual({ id: 'userId', firstName: 'John Doe' }) // Password harus sudah dihapus
  })

  it('should throw UnauthorizedException if token has expired', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new TokenExpiredError('jwt expired', new Date())
    })

    const context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          cookies: { accessToken: 'expired_token' },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('token has expired')
    )
  })
})
