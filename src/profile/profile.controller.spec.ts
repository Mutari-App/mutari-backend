import { Test, TestingModule } from '@nestjs/testing'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus } from '@nestjs/common'

describe('ProfileController', () => {
  let controller: ProfileController

  const mockProfileService = {
    findOne: jest.fn(),
    getListItineraries: jest.fn(),
    getListItineraryLikes: jest.fn(),
    updateProfile: jest.fn(),
  }

  const mockResponseUtil = {
    response: jest.fn((meta, data) => ({ meta, data })),
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
          useValue: mockResponseUtil,
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
    it('should return a profile when findOne is called with a valid ID', async () => {
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

      expect(result).toEqual({
        meta: {
          message: 'Profile retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          profile: expectedProfile,
        },
      })
      expect(mockProfileService.findOne).toHaveBeenCalledWith(id)
    })
  })

  describe('getListItineraries', () => {
    it('should return itineraries when getListItineraries is called with a valid ID', async () => {
      const id = 'user-123'
      const expectedItineraries = [
        {
          id: 'itinerary-1',
          title: 'Trip to Paris',
          description: 'Exploring Paris',
          createdAt: new Date(),
        },
        {
          id: 'itinerary-2',
          title: 'Tokyo Adventure',
          description: 'Exploring Tokyo',
          createdAt: new Date(),
        },
      ]

      mockProfileService.getListItineraries.mockResolvedValue(
        expectedItineraries
      )

      const result = await controller.getListItineraries(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraries: expectedItineraries,
        },
      })
      expect(mockProfileService.getListItineraries).toHaveBeenCalledWith(id)
    })

    it('should return empty array when user has no itineraries', async () => {
      const id = 'user-123'
      mockProfileService.getListItineraries.mockResolvedValue([])

      const result = await controller.getListItineraries(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraries: [],
        },
      })
    })
  })

  describe('getListItineraryLikes', () => {
    it('should return itinerary likes when getListItineraryLikes is called with a valid ID', async () => {
      const id = 'user-123'
      const expectedLikes = [
        {
          id: 'like-1',
          itineraryId: 'itinerary-1',
          createdAt: new Date(),
        },
        {
          id: 'like-2',
          itineraryId: 'itinerary-2',
          createdAt: new Date(),
        },
      ]

      mockProfileService.getListItineraryLikes.mockResolvedValue(expectedLikes)

      const result = await controller.getListItineraryLikes(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary likes retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraryLikes: expectedLikes,
        },
      })
      expect(mockProfileService.getListItineraryLikes).toHaveBeenCalledWith(id)
    })

    it('should return empty array when user has no itinerary likes', async () => {
      const id = 'user-123'
      mockProfileService.getListItineraryLikes.mockResolvedValue([])

      const result = await controller.getListItineraryLikes(id)

      expect(result).toEqual({
        meta: {
          message: 'List itinerary likes retrieved successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          itineraryLikes: [],
        },
      })
    })
  })
  describe('updateProfile', () => {
    it('should update a profile when called with valid ID and data', async () => {
      const id = 'user-123'
      const updateProfileDto = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '087654321098',
        birthDate: new Date('1990-01-01'),
      }

      const updatedProfile = {
        id,
        ...updateProfileDto,
        updatedAt: new Date(),
        createdAt: new Date(),
        photoProfile: 'profile.png',
        referralCode: 'ABCD1234',
        isEmailConfirmed: true,
        referredById: 'referred-user-123',
        loyaltyPoints: 1000,
      }

      mockProfileService.updateProfile.mockResolvedValue(updatedProfile)

      const result = await controller.updateProfile(id, updateProfileDto)

      expect(result).toEqual({
        meta: {
          message: 'Profile updated successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          updatedProfile,
        },
      })
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        id,
        updateProfileDto
      )
    })

    it('should update only the fields provided in the DTO', async () => {
      const id = 'user-123'
      const updateProfileDto = {
        firstName: 'Updated',
      }

      const updatedProfile = {
        id,
        firstName: 'Updated',
        lastName: 'Doe',
        phoneNumber: '081234123412',
        updatedAt: new Date(),
        createdAt: new Date(),
        photoProfile: 'profile.png',
        referralCode: 'ABCD1234',
        isEmailConfirmed: true,
        referredById: 'referred-user-123',
        loyaltyPoints: 1000,
        birthDate: new Date(),
      }

      mockProfileService.updateProfile.mockResolvedValue(updatedProfile)

      const result = await controller.updateProfile(id, updateProfileDto)

      expect(result.data.updatedProfile).toEqual(updatedProfile)
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        id,
        updateProfileDto
      )
    })
  })
})
