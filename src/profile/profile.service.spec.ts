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
    it('should return a profile by id', async () => {
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
            id: 'itinerary1',
            title: 'Weekend Trip',
            description: 'Short getaway',
            coverImage: 'trip.jpg',
            startDate: new Date('2023-05-01'),
            endDate: new Date('2023-05-03'),
            _count: {
              likes: 5,
            },
            sections: [
              {
                _count: {
                  blocks: 2,
                },
              },
            ],
          },
        ],
        itineraryLikes: [],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id },
        })
      )
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
        itineraries: [
          {
            id: 'itinerary1',
            title: 'Weekend Trip',
            description: 'Short getaway',
            coverImage: 'trip.jpg',
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            totalLikes: 5,
            totalDestinations: 2,
          },
        ],
        itineraryLikes: [],
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

    it('should transform user data correctly with itineraries and likes', async () => {
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
            id: 'itinerary1',
            title: 'Trip to Bali',
            description: 'Beach vacation',
            coverImage: 'bali.jpg',
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-07'),
            _count: {
              likes: 10,
            },
            sections: [
              {
                _count: {
                  blocks: 3,
                },
              },
              {
                _count: {
                  blocks: 2,
                },
              },
            ],
          },
        ],
        itineraryLikes: [
          {
            itinerary: {
              id: 'itinerary2',
              title: 'Tokyo Adventure',
              description: 'City exploration',
              coverImage: 'tokyo.jpg',
              startDate: new Date('2023-02-01'),
              endDate: new Date('2023-02-10'),
              _count: {
                likes: 15,
              },
              sections: [
                {
                  _count: {
                    blocks: 4,
                  },
                },
              ],
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
        select: expect.any(Object),
      })

      expect(result).toEqual(
        expect.objectContaining({
          id,
          photoProfile: 'profile.jpg',
          firstName: 'John',
          lastName: 'Doe',
          referralCode: 'REF123',
          loyaltyPoints: 100,
          totalReferrals: 5,
          totalItineraries: 2,
          totalLikes: 10,
          itineraries: [
            expect.objectContaining({
              id: 'itinerary1',
              title: 'Trip to Bali',
              totalLikes: 10,
              totalDestinations: 5,
            }),
          ],
          itineraryLikes: [
            expect.objectContaining({
              id: 'itinerary2',
              title: 'Tokyo Adventure',
              totalLikes: 15,
              totalDestinations: 4,
            }),
          ],
        })
      )

      // Verify no sections in the result
      expect(result.itineraries[0]).not.toHaveProperty('sections')
      expect(result.itineraryLikes[0]).not.toHaveProperty('sections')
    })

    it('should handle user with no itineraries or likes', async () => {
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
        itineraryLikes: [],
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id,
          totalReferrals: 0,
          totalItineraries: 0,
          totalLikes: 0,
          itineraries: [],
          itineraryLikes: [],
        })
      )
    })
  })
})
