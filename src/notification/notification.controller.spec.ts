import { Test, TestingModule } from '@nestjs/testing'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { User } from '@prisma/client'

describe('NotificationController', () => {
  let controller: NotificationController
  let service: NotificationService
  let responseUtil: ResponseUtil

  const mockUser: User = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date(),
      email: 'john@example.com',
      phoneNumber: '123456789',
      password: 'hashedpassword',
      photoProfile: null,
      referralCode: null,
      isEmailConfirmed: false,
      referredById: null,
      loyaltyPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
            scheduleEmail: jest.fn(),
            cancelScheduledEmail: jest.fn(),
          },
        },
        {
          provide: ResponseUtil,
          useValue: {
            response: jest.fn()
          },
        }
      ],
    }).compile()

    controller = module.get<NotificationController>(NotificationController)
    service = module.get<NotificationService>(NotificationService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
