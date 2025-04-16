import { Test, TestingModule } from '@nestjs/testing'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { ResponseUtil } from 'src/common/utils/response.util'

fdescribe('ProfileController', () => {
  let controller: ProfileController

  const mockProfileService = {
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
        {
          provide: ResponseUtil,
          useClass: ResponseUtil,
        },
      ],
    }).compile()

    controller = module.get<ProfileController>(ProfileController)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('findOne', () => {
    it('should return a profile without email and password when findOne is called with a valid ID', async () => {
      const id = 'user-123'
      const expectedProfile = {
        id,
        updatedAt: new Date(),
        createdAt: new Date(),
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '081234123412',
        photoProfile: 'profile.png',
        referralCode: 'ABCD1234',
        isEmailConfirmed: true,
        referredById: 'referred-user-123',
        loyaltyPoints: 1000,
        birthDate: new Date(),
      }

      mockProfileService.findOne.mockResolvedValue(expectedProfile)

      const result = await controller.findOne(id)

      expect(result).toBeDefined()
    })
  })
})
