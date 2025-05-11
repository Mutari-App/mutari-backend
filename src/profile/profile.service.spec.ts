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
    itinerary: {
      findMany: jest.fn(),
    },
    itineraryLike: {
      findMany: jest.fn(),
    },
    tourTicket: {
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

  describe('getTransactionHistory', () => {
    it('should return a list of transactions for a user', async () => {
      // Arrange
      const userId = 'user123'
      const mockTransactions = [
        {
          id: 'transaction1',
          tourId: 'tour1',
          userId,
          quantity: 2,
          paymentStatus: 'PAID',
          totalPrice: 500000,
          createdAt: new Date('2023-05-15'),
          tour: {
            title: 'Bali Adventure',
            location: 'Bali, Indonesia',
          },
          guests: [
            { id: 'guest1', name: 'John Doe', email: 'john@example.com' },
            { id: 'guest2', name: 'Jane Doe', email: 'jane@example.com' },
          ],
        },
        {
          id: 'transaction2',
          tourId: 'tour2',
          userId,
          quantity: 1,
          paymentStatus: 'PENDING',
          totalPrice: 350000,
          createdAt: new Date('2023-04-20'),
          tour: {
            title: 'Yogyakarta Cultural Tour',
            location: 'Yogyakarta, Indonesia',
          },
          guests: [
            { id: 'guest3', name: 'Bob Smith', email: 'bob@example.com' },
          ],
        },
      ]

      // Add the missing mock implementation for tourTicket.findMany
      mockPrismaService.tourTicket = {
        findMany: jest.fn().mockResolvedValue(mockTransactions),
      }

      // Act
      const result = await service.getTransactionHistory(userId)

      // Assert
      expect(mockPrismaService.tourTicket.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          tour: {
            select: {
              title: true,
              location: true,
            },
          },
          guests: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'transaction1',
          tourId: 'tour1',
          quantity: 2,
          paymentStatus: 'PAID',
          totalPrice: 500000,
          tour: {
            title: 'Bali Adventure',
            location: 'Bali, Indonesia',
          },
        })
      )
      expect(result[0].guests).toHaveLength(2)
      expect(result[1].guests).toHaveLength(1)
    })

    it('should return an empty array when user has no transactions', async () => {
      // Arrange
      const userId = 'user-no-transactions'
      mockPrismaService.tourTicket.findMany.mockResolvedValue([])

      // Act
      const result = await service.getTransactionHistory(userId)

      // Assert
      expect(mockPrismaService.tourTicket.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual([])
    })

    it('should include all transaction fields in the result', async () => {
      // Arrange
      const userId = 'user123'
      const mockTransaction = {
        id: 'transaction3',
        tourId: 'tour3',
        userId,
        quantity: 3,
        paymentStatus: 'PAID',
        totalPrice: 750000,
        createdAt: new Date('2023-06-10'),
        tour: {
          title: 'Jakarta City Tour',
          location: 'Jakarta, Indonesia',
        },
        guests: [],
      }

      mockPrismaService.tourTicket.findMany.mockResolvedValue([mockTransaction])

      // Act
      const result = await service.getTransactionHistory(userId)

      // Assert
      expect(result[0]).toEqual(mockTransaction)
      // Verify all important fields are present
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('tourId')
      expect(result[0]).toHaveProperty('quantity')
      expect(result[0]).toHaveProperty('paymentStatus')
      expect(result[0]).toHaveProperty('totalPrice')
      expect(result[0]).toHaveProperty('createdAt')
      expect(result[0]).toHaveProperty('tour')
      expect(result[0]).toHaveProperty('guests')
    })
  })
})
