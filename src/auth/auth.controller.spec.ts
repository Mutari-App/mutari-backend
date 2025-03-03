import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { LoginDTO } from './dto/login.dto'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'

describe('AuthController', () => {
  let controller: AuthController
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)
  })

  describe('login', () => {
    it('should return access and refresh tokens on successful login', async () => {
      const dto: LoginDTO = {
        email: 'test@example.com',
        password: 'password123',
      }
      const mockResponse = {
        accessToken: 'mocked-access-token',
        refreshToken: 'mocked-refresh-token',
      }

      jest.spyOn(service, 'login').mockResolvedValue(mockResponse)

      const result = await controller.login(dto)

      expect(service.login).toHaveBeenCalledWith(dto)
      expect(result).toEqual(mockResponse)
    })

    it('should throw BadRequestException if email format is invalid', async () => {
      const dto: LoginDTO = { email: 'invalid-email', password: 'password123' }

      jest
        .spyOn(service, 'login')
        .mockRejectedValue(new BadRequestException('Invalid email format'))

      await expect(controller.login(dto)).rejects.toThrow(BadRequestException)
    })

    it('should throw UnauthorizedException if email is not registered', async () => {
      const dto: LoginDTO = {
        email: 'notfound@example.com',
        password: 'password123',
      }

      jest
        .spyOn(service, 'login')
        .mockRejectedValue(
          new UnauthorizedException('Email atau password salah')
        )

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const dto: LoginDTO = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      jest
        .spyOn(service, 'login')
        .mockRejectedValue(
          new UnauthorizedException('Email atau password salah')
        )

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException)
    })
  })
})
