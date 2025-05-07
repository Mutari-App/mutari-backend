import { Test, TestingModule } from '@nestjs/testing'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus } from '@nestjs/common'
import { User } from '@prisma/client'

describe('ProfileController', () => {
  let controller: ProfileController

  const mockProfileService = {
    findOne: jest.fn(),
    getListItineraries: jest.fn(),
    getListItineraryLikes: jest.fn(),
    updateProfile: jest.fn(),
    sendVerificationCode: jest.fn(),
    verifyEmailChange: jest.fn(),
    changePassword: jest.fn(),
    updatePhotoProfile: jest.fn(),
  }

  const mockResponseUtil = {
    response: jest.fn((meta, data) => ({ meta, data })),
  }

  const mockUser: User = {
    id: 'user-123',
    updatedAt: new Date(),
    createdAt: new Date(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
    phoneNumber: '081234123412',
    password: 'password-123',
    photoProfile: 'profile.png',
    referralCode: 'ABCD1234',
    isEmailConfirmed: true,
    referredById: 'referred-user-123',
    loyaltyPoints: 1000,
    birthDate: new Date(),
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
        birthDate: '1990-01-01',
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

      const result = await controller.updateProfile(mockUser, updateProfileDto)

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
        mockUser.id,
        updateProfileDto
      )
    })

    it('should update only the fields provided in the DTO', async () => {
      const updateProfileDto = {
        firstName: 'Updated',
      }

      const updatedProfile = {
        id: 'user-123',
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

      const result = await controller.updateProfile(mockUser, updateProfileDto)

      expect(result.data.updatedProfile).toEqual(updatedProfile)
      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateProfileDto
      )
    })
  })

  describe('requestChangeEmail', () => {
    it('should call sendVerificationCode service with correct parameters', async () => {
      const requestEmailChangeDTO = {
        email: 'newemail@example.com',
      }

      await controller.requestChangeEmail(mockUser, requestEmailChangeDTO)

      expect(mockProfileService.sendVerificationCode).toHaveBeenCalledWith(
        mockUser,
        requestEmailChangeDTO.email
      )
    })

    it('should return success response when email change request is successful', async () => {
      const requestEmailChangeDTO = {
        email: 'newemail@example.com',
      }

      mockProfileService.sendVerificationCode.mockResolvedValue(undefined)

      const result = await controller.requestChangeEmail(
        mockUser,
        requestEmailChangeDTO
      )

      expect(result).toEqual({
        meta: {
          message: 'Verification code sent to your email',
          statusCode: HttpStatus.OK,
        },
        data: undefined,
      })
    })
  })

  describe('changeEmailVerification', () => {
    it('should call verifyEmailChange service with correct parameters', async () => {
      const changeEmailVerificationDTO = {
        code: 'ABCD1234',
      }

      mockProfileService.verifyEmailChange.mockResolvedValue(undefined)

      await controller.changeEmailVerification(
        mockUser,
        changeEmailVerificationDTO
      )

      expect(mockProfileService.verifyEmailChange).toHaveBeenCalledWith(
        mockUser,
        changeEmailVerificationDTO.code
      )
    })

    it('should return success response when email change verification is successful', async () => {
      const changeEmailVerificationDTO = {
        code: 'ABCD1234',
      }

      mockProfileService.verifyEmailChange.mockResolvedValue(undefined)

      const result = await controller.changeEmailVerification(
        mockUser,
        changeEmailVerificationDTO
      )

      expect(result).toEqual({
        meta: {
          message: 'Email changed successfully',
          statusCode: HttpStatus.OK,
        },
        data: undefined,
      })
    })
  })

  describe('changePassword', () => {
    beforeEach(() => {
      mockProfileService.changePassword = jest.fn()
    })

    it('should call changePassword service with correct parameters', async () => {
      const changePasswordDto = {
        oldPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }

      await controller.changePassword(mockUser, changePasswordDto)

      expect(mockProfileService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto
      )
    })

    it('should return success response when password change is successful', async () => {
      const changePasswordDto = {
        oldPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmPassword: 'newPassword123',
      }

      mockProfileService.changePassword.mockResolvedValue(undefined)

      const result = await controller.changePassword(
        mockUser,
        changePasswordDto
      )

      expect(result).toEqual({
        meta: {
          message: 'Password changed successfully',
          statusCode: HttpStatus.OK,
        },
        data: undefined,
      })
    })
  })

  describe('updatePhotoProfile', () => {
    beforeEach(() => {
      mockProfileService.updatePhotoProfile = jest.fn()
    })

    it('should update photo profile when called with valid URL', async () => {
      const photoProfileUrl = 'https://example.com/new-profile.jpg'
      const updatedProfile = {
        ...mockUser,
        photoProfile: photoProfileUrl,
        updatedAt: new Date(),
      }

      mockProfileService.updatePhotoProfile.mockResolvedValue(updatedProfile)

      const result = await controller.updatePhotoProfile(
        mockUser,
        photoProfileUrl
      )

      expect(result).toEqual({
        meta: {
          message: 'Profile photo updated successfully',
          statusCode: HttpStatus.OK,
        },
        data: {
          updatedProfile,
        },
      })
      expect(mockProfileService.updatePhotoProfile).toHaveBeenCalledWith(
        mockUser.id,
        photoProfileUrl
      )
    })

    it('should call updatePhotoProfile service with correct parameters', async () => {
      const photoProfileUrl = 'https://example.com/profile-picture.png'

      await controller.updatePhotoProfile(mockUser, photoProfileUrl)

      expect(mockProfileService.updatePhotoProfile).toHaveBeenCalledWith(
        mockUser.id,
        photoProfileUrl
      )
    })
  })
})
