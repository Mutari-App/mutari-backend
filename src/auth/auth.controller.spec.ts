import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginDTO } from './dto/login.dto'
import { UnauthorizedException } from '@nestjs/common'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Request, Response } from 'express'
import { COOKIE_CONFIG } from './constant'

fdescribe('AuthController', () => {
  let controller: AuthController
  let service: AuthService
  let mockResponse: Partial<Response>
  let mockRequest: Partial<Request>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: ResponseUtil,
          useClass: ResponseUtil,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)

    mockResponse = {
      cookie: jest.fn(),
    } as Partial<Response>

    mockRequest = {
      user: {
        user: { id: 1, email: 'test@example.com' },
        refreshTokenExpiresAt: new Date(),
      },
      cookies: { refreshToken: 'mocked-refresh-token' },
    } as Partial<Request>
  })

  describe('login', () => {
    it('should return access and refresh tokens on successful login', async () => {
      const dto: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      }
      const mockLoginResponse = {
        accessToken: 'mocked-access-token',
        refreshToken: 'mocked-refresh-token',
      }

      jest.spyOn(service, 'login').mockResolvedValue(mockLoginResponse)

      const result = await controller.login(dto, mockResponse as Response)

      expect(service.login).toHaveBeenCalledWith(dto)
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.accessToken.name,
        mockLoginResponse.accessToken,
        expect.any(Object)
      )
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.refreshToken.name,
        mockLoginResponse.refreshToken,
        expect.any(Object)
      )
      expect(result).toEqual({
        message: 'Success Login',
        statusCode: 200,
        success: true,
      })
    })

    it('should throw UnauthorizedException if email is not registered', async () => {
      const dto: LoginDTO = {
        email: 'notfound@example.com',
        password: 'password123',
      }

      jest
        .spyOn(service, 'login')
        .mockRejectedValue(
          new UnauthorizedException('Incorrect Email or Password')
        )

      await expect(
        controller.login(dto, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const dto: LoginDTO = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      jest
        .spyOn(service, 'login')
        .mockRejectedValue(
          new UnauthorizedException('Incorrect Email or Password')
        )

      await expect(
        controller.login(dto, mockResponse as Response)
      ).rejects.toThrow(UnauthorizedException)
    })
  })
})
