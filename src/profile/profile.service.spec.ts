import { Test, TestingModule } from '@nestjs/testing'
import { ProfileService } from './profile.service'
import { CreateProfileDto } from './dto/create-profile.dto'
import { UpdateProfileDto } from './dto/update-profile.dto'

describe('ProfileService', () => {
  let service: ProfileService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfileService],
    }).compile()

    service = module.get<ProfileService>(ProfileService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should return a string indicating a new profile has been added', () => {
      const createProfileDto: CreateProfileDto = {}
      expect(service.create(createProfileDto)).toBe(
        'This action adds a new profile'
      )
    })
  })

  describe('findAll', () => {
    it('should return all profiles', () => {
      expect(service.findAll()).toBe('This action returns all profile')
    })
  })

  describe('findOne', () => {
    it('should return a profile by id', () => {
      const id = 1
      expect(service.findOne(id)).toBe(`This action returns a #${id} profile`)
    })
  })

  describe('update', () => {
    it('should update a profile', () => {
      const id = 1
      const updateProfileDto: UpdateProfileDto = {}
      expect(service.update(id, updateProfileDto)).toBe(
        `This action updates a #${id} profile`
      )
    })
  })

  describe('remove', () => {
    it('should remove a profile', () => {
      const id = 1
      expect(service.remove(id)).toBe(`This action removes a #${id} profile`)
    })
  })
})
