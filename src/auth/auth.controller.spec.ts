import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginDTO } from './dto/login.dto'
import { UnauthorizedException } from '@nestjs/common'
import { ResponseUtil } from 'src/common/utils/response.util'
import { Request, Response } from 'express'
import { COOKIE_CONFIG } from './constant'
import { CreateUserDTO } from './dto/create-user-dto'
import { RegisterDTO } from './dto/register-dto'
import { VerifyRegistrationDTO } from './dto/verify-registration-dto'

describe('AuthController', () => {
  let controller: AuthController
  let service: AuthService
  let mockResponse: Partial<Response>
  let mockRequest: Partial<Request>
  let responseUtil: ResponseUtil

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refreshToken: jest.fn(),
            createUser: jest.fn(),
            sendVerification: jest.fn(),
            verify: jest.fn(),
            register: jest.fn(),
          },
        },
        {
          provide: ResponseUtil,
          useClass: ResponseUtil,
          useValue: {
            response: jest.fn().mockImplementation((data) => data),
          },
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
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
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

  describe('refreshToken', () => {
    it('should return new access and refresh tokens', async () => {
      const mockRefreshResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }

      jest.spyOn(service, 'refreshToken').mockResolvedValue(mockRefreshResponse)

      const result = await controller.refreshToken(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(service.refreshToken).toHaveBeenCalledWith(
        (mockRequest.user as any).user,
        mockRequest.cookies.refreshToken,
        (mockRequest.user as any).refreshTokenExpiresAt
      )
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.accessToken.name,
        mockRefreshResponse.accessToken,
        expect.any(Object)
      )
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.refreshToken.name,
        mockRefreshResponse.refreshToken,
        expect.any(Object)
      )
      expect(result).toEqual({
        message: 'Success get Refresh Token',
        statusCode: 200,
        success: true,
      })
    })

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      jest
        .spyOn(service, 'refreshToken')
        .mockRejectedValue(new UnauthorizedException('Invalid refresh token'))

      await expect(
        controller.refreshToken(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('createUser', () => {
    it('should call authService.createUser and authService.sendVerification with correct data', async () => {
      const dto: CreateUserDTO = {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }
      jest.spyOn(service, 'createUser').mockResolvedValue(undefined)
      jest.spyOn(service, 'sendVerification').mockResolvedValue(undefined)

      const result = await controller.createUser(dto)
      expect(service.createUser).toHaveBeenCalledWith(dto)
      expect(service.sendVerification).toHaveBeenCalledWith(dto)
      expect(result).toEqual({
        statusCode: 201,
        message: 'User created successfully. Please verify your email',
        success: true,
      })
    })
  })

  describe('verify', () => {
    it('should call authService.verify with correct data', async () => {
      const dto: VerifyRegistrationDTO = {
        verificationCode: 'code',
        email: 'john.doe@example.com',
        firstName: 'John',
      }
      jest.spyOn(service, 'verify').mockResolvedValue(undefined)

      const result = await controller.verify(dto)
      expect(service.verify).toHaveBeenCalledWith(dto)
      expect(result).toEqual({
        statusCode: 200,
        message: 'Verification successful',
        success: true,
      })
    })
  })

  describe('register', () => {
    it('should call authService.register with correct data', async () => {
      const dto: RegisterDTO = {
        email: 'john.doe@example.com',
        password: 'password',
        confirmPassword: 'password',
        firstName: 'John',
        verificationCode: 'code',
      }
      jest.spyOn(service, 'register').mockResolvedValue(undefined)

      const result = await controller.register(dto)
      expect(service.register).toHaveBeenCalledWith(dto)
      expect(result).toEqual({
        statusCode: 200,
        message: 'Registration successful',
        success: true,
      })
    })
  })

  describe('logout', () => {
    it('should clear refreshToken cookie', () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response

      controller.logout(mockResponse)

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.refreshToken.name,
        { ...COOKIE_CONFIG.refreshToken.options }
      )
    })
  })

  describe('getme', () => {
    it('should return the authenticated user', () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }

      jest
        .spyOn(responseUtil, 'response')
        .mockImplementation((data, payload) => ({
          ...data,
          ...payload,
          success: true,
        }))

      const result = controller.getme(mockUser as any)

      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: 200,
          message: 'User fetched successfully.',
        },
        {
          user: mockUser,
        }
      )

      expect(result).toEqual({
        statusCode: 200,
        message: 'User fetched successfully.',
        user: mockUser,
        success: true,
      })
    })
  })
})
