import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { CreateUserDTO } from './dto/create-user-dto'
import { RegisterDTO } from './dto/register-dto'
import { VerifyRegistrationDTO } from './dto/verify-registration-dto'
import { ResponseUtil } from 'src/common/utils/response.util'

describe('AuthController', () => {
  let controller: AuthController
  let service: AuthService
  let responseUtil: ResponseUtil

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            createUser: jest.fn(),
            sendVerification: jest.fn(),
            verify: jest.fn(),
            register: jest.fn(),
          },
        },
        {
          provide: ResponseUtil,
          useValue: {
            response: jest.fn().mockImplementation((data) => data),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
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
      })
    })
  })
})
