import { Test, TestingModule } from '@nestjs/testing'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

describe('ProfileController', () => {
  let controller: ProfileController
  let service: ProfileService

  beforeEach(async () => {
    const mockProfileService = {
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      findAll: jest.fn(() => [
        { id: 1, name: 'Test Profile 1' },
        { id: 2, name: 'Test Profile 2' },
      ]),
      findOne: jest.fn((id) => ({ id, name: 'Test Profile' })),
      update: jest.fn((id, dto) => ({ id, ...dto })),
      remove: jest.fn((id) => ({ id, name: 'Test Profile' })),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile()

    controller = module.get<ProfileController>(ProfileController)
    service = module.get<ProfileService>(ProfileService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a profile', () => {
      const createProfileDto: CreateProfileDto = {
        name: 'Test Profile',
        bio: 'Test Bio',
      }

      expect(controller.create(createProfileDto)).toEqual({
        id: 1,
        ...createProfileDto,
      })
      expect(service.create).toHaveBeenCalledWith(createProfileDto)
    })
  })

  describe('findAll', () => {
    it('should return an array of profiles', () => {
      expect(controller.findAll()).toEqual([
        { id: 1, name: 'Test Profile 1' },
        { id: 2, name: 'Test Profile 2' },
      ])
      expect(service.findAll).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('should return a single profile', () => {
      const id = '1'
      expect(controller.findOne(id)).toEqual({
        id: 1,
        name: 'Test Profile',
      })
      expect(service.findOne).toHaveBeenCalledWith(1)
    })
  })

  describe('update', () => {
    it('should update a profile', () => {
      const id = '1'
      const updateProfileDto: UpdateProfileDto = {
        name: 'Updated Profile',
        bio: 'Updated Bio',
      }

      expect(controller.update(id, updateProfileDto)).toEqual({
        id: 1,
        ...updateProfileDto,
      })
      expect(service.update).toHaveBeenCalledWith(1, updateProfileDto)
    })
  })

  describe('remove', () => {
    it('should remove a profile', () => {
      const id = '1'
      expect(controller.remove(id)).toEqual({
        id: 1,
        name: 'Test Profile',
      })
      expect(service.remove).toHaveBeenCalledWith(1)
    })
  })
})
