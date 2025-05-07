import { Test, TestingModule } from '@nestjs/testing'
import { ProfileService } from './profile.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

describe('ProfileService', () => {
  let service: ProfileService
  let prismaService: PrismaService

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    itinerary: {
      findMany: jest.fn(),
    },
    itineraryLike: {
      findMany: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<ProfileService>(ProfileService)
    prismaService = module.get<PrismaService>(PrismaService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOne', () => {
    it('should return a user profile by id', async () => {
      // Arrange
      const id = '123'
      const mockUser = {
        id,
        photoProfile: 'avatar.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        _count: {
          referrals: 2,
          itineraries: 1,
        },
        loyaltyPoints: 50,
        itineraries: [
          {
            _count: {
              likes: 5,
            },
          },
        ],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
        select: expect.objectContaining({
          id: true,
          photoProfile: true,
          firstName: true,
          lastName: true,
          referralCode: true,
          loyaltyPoints: true,
        }),
      })
      expect(result).toEqual({
        id,
        photoProfile: 'avatar.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        loyaltyPoints: 50,
        totalReferrals: 2,
        totalItineraries: 1,
        totalLikes: 5,
      })
    })

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      const id = 'nonexistent-id'
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`User with id ${id} not found`)
      )
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id },
        })
      )
    })

    it('should calculate totalLikes from itineraries correctly', async () => {
      // Arrange
      const id = '123'
      const mockUser = {
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        _count: {
          referrals: 5,
          itineraries: 2,
        },
        loyaltyPoints: 100,
        itineraries: [
          {
            _count: {
              likes: 10,
            },
          },
          {
            _count: {
              likes: 15,
            },
          },
        ],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(result.totalLikes).toBe(25)
      expect(result).toEqual({
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        loyaltyPoints: 100,
        totalReferrals: 5,
        totalItineraries: 2,
        totalLikes: 25,
      })
    })

    it('should handle user with no itineraries', async () => {
      // Arrange
      const id = '123'
      const mockUser = {
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        _count: {
          referrals: 0,
          itineraries: 0,
        },
        loyaltyPoints: 0,
        itineraries: [],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(result).toEqual({
        id,
        photoProfile: 'profile.jpg',
        firstName: 'John',
        lastName: 'Doe',
        referralCode: 'REF123',
        loyaltyPoints: 0,
        totalReferrals: 0,
        totalItineraries: 0,
        totalLikes: 0,
      })
    })
  })
  describe('getListItineraries', () => {
    it('should return a list of itineraries for a user', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraries = [
        {
          id: 'itinerary1',
          title: 'Paris Trip',
          description: 'City of Lights',
          coverImage: 'paris.jpg',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-06-07'),
          _count: { likes: 12 },
          sections: [{ _count: { blocks: 3 } }, { _count: { blocks: 2 } }],
        },
        {
          id: 'itinerary2',
          title: 'Rome Weekend',
          description: 'Italian getaway',
          coverImage: 'rome.jpg',
          startDate: new Date('2023-07-15'),
          endDate: new Date('2023-07-17'),
          _count: { likes: 8 },
          sections: [{ _count: { blocks: 4 } }],
        },
      ]

      mockPrismaService.itinerary.findMany.mockResolvedValue(mockItineraries)

      // Act
      const result = await service.getListItineraries(userId)

      // Assert
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'itinerary1',
        title: 'Paris Trip',
        description: 'City of Lights',
        coverImage: 'paris.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 12,
        totalDestinations: 5,
      })
      expect(result[1]).toEqual({
        id: 'itinerary2',
        title: 'Rome Weekend',
        description: 'Italian getaway',
        coverImage: 'rome.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 8,
        totalDestinations: 4,
      })

      // Verify no sections in the result
      expect(result[0]).not.toHaveProperty('sections')
      expect(result[1]).not.toHaveProperty('_count')
    })

    it('should handle user with no itineraries', async () => {
      // Arrange
      const userId = 'user123'
      mockPrismaService.itinerary.findMany.mockResolvedValue([])

      // Act
      const result = await service.getListItineraries(userId)

      // Assert
      expect(mockPrismaService.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { updatedAt: 'desc' },
      })
      expect(result).toEqual([])
    })

    it('should correctly calculate totalDestinations when sections is empty', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraries = [
        {
          id: 'itinerary1',
          title: 'Empty Trip',
          description: 'No destinations yet',
          coverImage: 'empty.jpg',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2023-06-07'),
          _count: { likes: 3 },
          sections: [], // Empty sections
        },
      ]

      mockPrismaService.itinerary.findMany.mockResolvedValue(mockItineraries)

      // Act
      const result = await service.getListItineraries(userId)

      // Assert
      expect(result[0].totalDestinations).toBe(0)
      expect(result[0].totalLikes).toBe(3)
    })
  })

  describe('getListItineraryLikes', () => {
    it('should return a list of liked itineraries for a user', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraryLikes = [
        {
          itinerary: {
            id: 'itinerary1',
            title: 'Mountain Retreat',
            description: 'Peaceful getaway',
            coverImage: 'mountain.jpg',
            startDate: new Date('2023-08-10'),
            endDate: new Date('2023-08-15'),
            _count: { likes: 20 },
            sections: [{ _count: { blocks: 2 } }, { _count: { blocks: 3 } }],
          },
        },
        {
          itinerary: {
            id: 'itinerary2',
            title: 'Beach Vacation',
            description: 'Sun and sand',
            coverImage: 'beach.jpg',
            startDate: new Date('2023-09-01'),
            endDate: new Date('2023-09-10'),
            _count: { likes: 15 },
            sections: [{ _count: { blocks: 4 } }],
          },
        },
      ]

      mockPrismaService.itineraryLike.findMany.mockResolvedValue(
        mockItineraryLikes
      )

      // Act
      const result = await service.getListItineraryLikes(userId)

      // Assert
      expect(mockPrismaService.itineraryLike.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'itinerary1',
        title: 'Mountain Retreat',
        description: 'Peaceful getaway',
        coverImage: 'mountain.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 20,
        totalDestinations: 5,
      })
      expect(result[1]).toEqual({
        id: 'itinerary2',
        title: 'Beach Vacation',
        description: 'Sun and sand',
        coverImage: 'beach.jpg',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        totalLikes: 15,
        totalDestinations: 4,
      })

      // Verify no sections in the result
      expect(result[0]).not.toHaveProperty('sections')
      expect(result[1]).not.toHaveProperty('_count')
    })

    it('should handle user with no liked itineraries', async () => {
      // Arrange
      const userId = 'user123'
      mockPrismaService.itineraryLike.findMany.mockResolvedValue([])

      // Act
      const result = await service.getListItineraryLikes(userId)

      // Assert
      expect(mockPrismaService.itineraryLike.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual([])
    })

    it('should correctly calculate totalDestinations when sections is empty', async () => {
      // Arrange
      const userId = 'user123'
      const mockItineraryLikes = [
        {
          itinerary: {
            id: 'itinerary1',
            title: 'Empty Trip',
            description: 'No destinations yet',
            coverImage: 'empty.jpg',
            startDate: new Date('2023-06-01'),
            endDate: new Date('2023-06-07'),
            _count: { likes: 2 },
            sections: [], // Empty sections
          },
        },
      ]

      mockPrismaService.itineraryLike.findMany.mockResolvedValue(
        mockItineraryLikes
      )

      // Act
      const result = await service.getListItineraryLikes(userId)

      // Assert
      expect(result[0].totalDestinations).toBe(0)
      expect(result[0].totalLikes).toBe(2)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile with valid data', async () => {
      // Arrange
      const userId = 'user123'
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
        photoProfile: 'new-avatar.jpg',
      }

      const mockUpdatedUser = {
        id: userId,
        firstName: 'Jane',
        lastName: 'Smith',
        photoProfile: 'new-avatar.jpg',
        email: 'jane@example.com',
      }

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser)

      // Act
      const result = await service.updateProfile(userId, updateData)

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          isEmailConfirmed: true,
          firstName: true,
          lastName: true,
          photoProfile: true,
          birthDate: true,
        },
      })
      expect(result).toEqual(mockUpdatedUser)
    })

    it('should only update specified fields', async () => {
      // Arrange
      const userId = 'user123'
      const updateData = {
        firstName: 'John',
        photoProfile: 'profile.jpg',
      }

      const mockUpdatedUser = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe', // unchanged
        photoProfile: 'profile.jpg',
        email: 'john@example.com',
      }

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser)

      // Act
      const result = await service.updateProfile(userId, updateData)

      // Assert
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          isEmailConfirmed: true,
          firstName: true,
          lastName: true,
          photoProfile: true,
          birthDate: true,
        },
      })
      expect(result).toEqual(mockUpdatedUser)
    })
  })
})
