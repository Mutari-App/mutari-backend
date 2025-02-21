import { Test, TestingModule } from '@nestjs/testing'
import { PreRegisterController } from './pre-register.controller'
import { PreRegisterService } from './pre-register.service'
import { PreRegisterDTO } from './dto/pre-register.dto'
import { LoginDTO } from './dto/login.dto'
import { User } from '@prisma/client'

describe('PreRegisterController', () => {
  let controller: PreRegisterController
  let service: PreRegisterService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreRegisterController],
      providers: [
        {
          provide: PreRegisterService,
          useValue: {
            createPreRegister: jest.fn(),
            getPreRegisterCount: jest.fn().mockResolvedValue({ count: 10 }),
            login: jest.fn(),
            validateLogin: jest.fn(),
            getReferralCode: jest
              .fn()
              .mockResolvedValue({ referralCode: 'ABCD1234', usedCount: 5 }),
          },
        },
      ],
    }).compile()

    controller = module.get<PreRegisterController>(PreRegisterController)
    service = module.get<PreRegisterService>(PreRegisterService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('preRegister', () => {
    it('should call service.createPreRegister with correct data', async () => {
      const dto: PreRegisterDTO = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '08123456789',
        referralCode: 'REF123',
      }
      jest.spyOn(service, 'createPreRegister').mockResolvedValue(dto)

      const result = await controller.preRegister(dto)
      expect(service.createPreRegister).toHaveBeenCalledWith(dto)
      expect(result).toEqual(dto)
    })
  })

  describe('getPreRegisterCount', () => {
    it('should return the pre-register count', async () => {
      const result = await controller.getPreRegisterCount()
      expect(result).toEqual({ count: 10 })
      expect(service.getPreRegisterCount).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should call service.login with the correct email', async () => {
      const dto: LoginDTO = { email: 'test@example.com' }
      jest
        .spyOn(service, 'login')
        .mockResolvedValue({ message: 'Login email sent' })

      const result = await controller.login(dto)
      expect(service.login).toHaveBeenCalledWith(dto.email)
      expect(result).toEqual({ message: 'Login email sent' })
    })
  })

  describe('validateLogin', () => {
    it('should call service.validateLogin with correct ticketId', async () => {
      const ticketId = 'TICKET123'
      jest
        .spyOn(service, 'validateLogin')
        .mockResolvedValue({ accessToken: 'JWT_TOKEN' })

      const result = await controller.validateLogin(ticketId)
      expect(service.validateLogin).toHaveBeenCalledWith(ticketId)
      expect(result).toEqual({ accessToken: 'JWT_TOKEN' })
    })
  })

  describe('referralCode', () => {
    it('should call service.getReferralCode with the correct userId', async () => {
      const user: User = {
        id: 'USER123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phoneNumber: '08123456789',
        referralCode: 'ABCD1234',
        isEmailConfirmed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        referredById: 'USER124',
      }

      const result = await controller.referralCode(user)
      expect(service.getReferralCode).toHaveBeenCalledWith(user.id)
      expect(result).toEqual({ referralCode: 'ABCD1234', usedCount: 5 })
    })
  })
})
