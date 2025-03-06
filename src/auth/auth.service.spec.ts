import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma/prisma.service'
import { UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { LoginDTO } from './dto/login.dto'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockResolvedValue({
                id: 1,
                email: 'test@example.com',
                password: 'hashedPassword',
              }),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('testToken'),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

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
            },
          },
          {
            provide: JwtService,
            useValue: {
              sign: jest.fn(),
            },
          },
        ],
      }).compile()

      service = module.get<AuthService>(AuthService)
      prismaService = module.get<PrismaService>(PrismaService)
      jwtService = module.get<JwtService>(JwtService)
    })

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

      jwtService.sign = jest.fn().mockReturnValue('testToken')

      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'password',
      }

      const result = await service.login(loginDto)

      expect(result).toEqual({
        accessToken: 'testToken',
        refreshToken: 'testToken',
      })
    })
  })
})
