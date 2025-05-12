import { Test, TestingModule } from '@nestjs/testing'
import { TourService } from './tour.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { MeilisearchService } from 'src/meilisearch/meilisearch.service'
import { User } from '@prisma/client'
import { DURATION_TYPE } from '@prisma/client'
import { NotFoundException } from '@nestjs/common'

describe('TourService', () => {
  let service: TourService
  let prismaService: PrismaService

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

  const mockPrismaService = {
    tour: {
      findUnique: jest.fn(),
    },
    itinerary: {
      findUnique: jest.fn(),
    },
    tourView: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  const mockMeilisearchService = {
    searchTours: jest.fn().mockResolvedValue({
      hits: [
        {
          id: 'tour1',
          title: 'Paris City Tour',
          coverImage: 'paris-tour.jpg',
          maxCapacity: 20,
          description: 'Guided tour of Paris highlights',
          location: 'Paris, France',
          pricePerTicket: 99.99,
          duration: 8,
          durationType: 'HOUR',
          availableTickets: 15,
          includes: [{ icon: 'food', text: 'Lunch included' }],
          itinerary: { id: 'itinerary1', title: 'Paris Trip' },
          user: { id: 'user1', firstName: 'John', lastName: 'Doe' },
        },
      ],
      estimatedTotalHits: 1,
    }),
    tourIncludes: {
      findMany: jest.fn(),
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TourService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MeilisearchService,
          useValue: mockMeilisearchService,
        },
      ],
    }).compile()

    service = module.get<TourService>(TourService)
    prismaService = module.get<PrismaService>(PrismaService)

    service = module.get<TourService>(TourService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getTourView', () => {
    it('should return list of tour views ordered by viewedAt desc', async () => {
      const user = { id: 'user123' }

      const now = new Date()

      const expectedResultFromDb = [
        {
          tourId: 'a',
          viewedAt: now,
          tour: {
            id: 'a',
            title: 'Sample tour A',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
        {
          tourId: 'b',
          viewedAt: now,
          tour: {
            id: 'b',
            title: 'Sample tour B',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
      ]

      mockPrismaService.tourView.findMany.mockResolvedValue(
        expectedResultFromDb
      )

      const result = await service.getTourView(user as any)

      expect(mockPrismaService.tourView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: user.id },
          orderBy: { viewedAt: 'desc' },
          include: expect.objectContaining({
            tour: true,
          }),
        })
      )

      expect(result).toEqual([
        {
          tourId: 'a',
          viewedAt: now,
          tour: {
            id: 'a',
            title: 'Sample tour A',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
        {
          tourId: 'b',
          viewedAt: now,
          tour: {
            id: 'b',
            title: 'Sample tour B',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
      ])
    })
  })

  describe('createTourView', () => {
    it('should update viewedAt if tour already viewed', async () => {
      const tours = [{ tourId: 'tour-1' }]
      const tourViews = [{ tourId: 'tour-1', userId: 'user-123' }]
      mockPrismaService.tour.findMany.mockResolvedValue(tours)
      mockPrismaService.tour.findUnique.mockResolvedValue(tours[0])
      mockPrismaService.tourView.findMany.mockResolvedValue(tourViews)

      await service.createTourView('tour-1', mockUser)

      expect(mockPrismaService.tourView.update).toHaveBeenCalledWith({
        where: {
          userId_tourId: {
            userId: 'user-123',
            tourId: 'tour-1',
          },
        },
        data: { viewedAt: expect.any(Date) },
      })
    })

    it('should throw NotFoundException if tour doesnt exist', async () => {
      const tours = [{ tourId: 'tour-1' }]
      const tourViews = [{ tourId: 'tour-1', userId: 'user-123' }]
      mockPrismaService.tour.findMany.mockResolvedValue(tours)
      mockPrismaService.tour.findUnique.mockResolvedValue(null)
      mockPrismaService.tourView.findMany.mockResolvedValue(tourViews)

      await expect(
        service.createTourView('not-existing-tour', mockUser)
      ).rejects.toBeInstanceOf(NotFoundException)

      expect(mockPrismaService.tour.findUnique).toHaveBeenCalledWith({
        where: { id: 'not-existing-tour' },
      })
      expect(mockPrismaService.tourView.update).not.toHaveBeenCalled()
      expect(mockPrismaService.tourView.create).not.toHaveBeenCalled()
      expect(mockPrismaService.tourView.delete).not.toHaveBeenCalled()
    })

    it('should delete oldest view if already 10 and add new', async () => {
      const userViews = Array.from({ length: 10 }).map((_, i) => ({
        id: `view-${i}`,
        tourId: `it-${i}`,
      }))
      const tours = [{ tourId: 'tour-1' }]

      mockPrismaService.tourView.findMany.mockResolvedValue(userViews)
      mockPrismaService.tour.findUnique.mockResolvedValue(tours[0])
      mockPrismaService.tourView.create.mockResolvedValue({})

      await service.createTourView('new-tour', mockUser)

      expect(mockPrismaService.tourView.delete).toHaveBeenCalledWith({
        where: { id: 'view-9' }, // assumed last in list is oldest
      })
      expect(mockPrismaService.tourView.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          tourId: 'new-tour',
          viewedAt: expect.any(Date),
        },
      })
    })

    it('should just create view if less than 10 views', async () => {
      const userViews = Array.from({ length: 5 }).map((_, i) => ({
        id: `view-${i}`,
        tourId: `tour-${i}`,
      }))
      const tours = [{ tourId: 'tour-1' }]

      mockPrismaService.tourView.findMany.mockResolvedValue(userViews)
      mockPrismaService.tourView.create.mockResolvedValue({})
      mockPrismaService.tour.findUnique.mockResolvedValue(tours[0])

      await service.createTourView('it-100', mockUser)

      expect(mockPrismaService.tourView.delete).not.toHaveBeenCalled()
      expect(mockPrismaService.tourView.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          tourId: 'it-100',
          viewedAt: expect.any(Date),
        },
      })
    })
  })

  describe('searchTours', () => {
    it('should search tours with default parameters', async () => {
      const result = await service.searchTours()

      expect(mockMeilisearchService.searchTours).toHaveBeenCalledWith('', {
        limit: 20,
        offset: 0,
        filter: undefined,
        sort: ['createdAt:desc'],
      })

      // Removed hasAvailableTickets from the expectation
      expect(result).toEqual({
        data: [
          {
            id: 'tour1',
            title: 'Paris City Tour',
            coverImage: 'paris-tour.jpg',
            maxCapacity: 20,
            description: 'Guided tour of Paris highlights',
            location: 'Paris, France',
            pricePerTicket: 99.99,
            duration: 8,
            durationType: 'HOUR',
            availableTickets: 15,
            includes: [{ icon: 'food', text: 'Lunch included' }],
            itinerary: { id: 'itinerary1', title: 'Paris Trip' },
            user: { id: 'user1', firstName: 'John', lastName: 'Doe' },
          },
        ],
        metadata: {
          total: 1,
          page: 1,
          totalPages: 1,
        },
      })
    })

    it('should search tours with filters and pagination', async () => {
      await service.searchTours(
        'paris',
        2,
        10,
        {
          location: 'Paris, France',
          minPrice: 50,
          maxPrice: 150,
          minDuration: 4,
          durationType: 'HOUR',
          hasAvailableTickets: true,
        },
        'pricePerTicket',
        'asc'
      )

      expect(mockMeilisearchService.searchTours).toHaveBeenCalledWith('paris', {
        limit: 10,
        offset: 10,
        filter: [
          [
            'location = "Paris, France"',
            'pricePerTicket >= 50',
            'pricePerTicket <= 150',
            'duration >= 4',
            'durationType = "HOUR"',
            'availableTickets > 0',
          ],
        ],
        sort: ['pricePerTicket:asc'],
      })
    })

    it('should handle empty search results', async () => {
      mockMeilisearchService.searchTours.mockResolvedValueOnce({
        hits: [],
        estimatedTotalHits: 0,
      })

      const result = await service.searchTours('nonexistent')

      expect(result).toEqual({
        data: [],
        metadata: {
          total: 0,
          page: 1,
          totalPages: 1,
        },
      })
    })

    it('should handle various duration filters correctly', async () => {
      // Test with only minDuration
      await service.searchTours('', 1, 10, { minDuration: 2 })
      expect(mockMeilisearchService.searchTours).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({
          filter: [['duration >= 2']],
        })
      )

      // Test with only maxDuration
      await service.searchTours('', 1, 10, { maxDuration: 5 })
      expect(mockMeilisearchService.searchTours).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({
          filter: [['duration <= 5']],
        })
      )

      // Test with both min and max duration
      await service.searchTours('', 1, 10, { minDuration: 2, maxDuration: 5 })
      expect(mockMeilisearchService.searchTours).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({
          filter: [['duration >= 2', 'duration <= 5']],
        })
      )
    })

    // Additional test for single filter
    it('should handle a single filter correctly', async () => {
      await service.searchTours('', 1, 10, { location: 'Tokyo, Japan' })
      expect(mockMeilisearchService.searchTours).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({
          filter: [['location = "Tokyo, Japan"']],
        })
      )
    })

    // Additional test for empty filters
    it('should handle no filters correctly', async () => {
      await service.searchTours('', 1, 10, {})
      expect(mockMeilisearchService.searchTours).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({
          filter: undefined,
        })
      )
  describe('findOne', () => {
    it('should return tour with itinerary when found', async () => {
      const tourId = 'tour123'
      const itineraryId = 'itinerary456'

      const mockTour = {
        id: tourId,
        title: 'Mount Bromo Tour',
        maxCapacity: 10,
        description: 'A tour to Mount Bromo',
        location: 'East Java',
        pricePerTicket: 100,
        duration: 3,
        DURATION_TYPE: DURATION_TYPE.DAY,
        itineraryId: itineraryId,
      }

      const mockItinerary = {
        id: itineraryId,
        title: 'Itinerary Title',
        sections: [
          {
            id: 'section1',
            blocks: [
              { id: 'block1', name: 'Block 1' },
              { id: 'block2', name: 'Block 2' },
            ],
          },
        ],
      }

      const mockIncludes = [
        { id: 'inc1', tourId, icon: 'home', text: 'hotel' },
        { id: 'inc2', tourId, icon: 'bus', text: 'transportasi' },
      ]

      prisma.tour.findUnique = jest.fn().mockResolvedValue(mockTour)
      prisma.itinerary.findUnique = jest.fn().mockResolvedValue(mockItinerary)
      prisma.tourIncludes.findMany = jest.fn().mockResolvedValue(mockIncludes)

      const result = await service.findOne(tourId)

      expect(result).toEqual({
        ...mockTour,
        itinerary: mockItinerary,
        includes: mockIncludes,
      })

      expect(prisma.tour.findUnique).toHaveBeenCalledWith({
        where: { id: tourId },
      })

      expect(prisma.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
        include: {
          sections: {
            include: {
              blocks: true,
            },
          },
        },
      })

      expect(prisma.tourIncludes.findMany).toHaveBeenCalledWith({
        where: { tourId },
      })
    })

    it('should throw NotFoundException if tour not found', async () => {
      prisma.tour.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should return tour with null itinerary if itinerary not found', async () => {
      const tourId = 'tour123'
      const itineraryId = 'itinerary999'

      const mockTour = {
        id: tourId,
        title: 'Simple Tour',
        itineraryId,
      }

      prisma.tour.findUnique = jest.fn().mockResolvedValue(mockTour)
      prisma.itinerary.findUnique = jest.fn().mockResolvedValue(null)
      prisma.tourIncludes.findMany = jest.fn().mockResolvedValue([])

      const result = await service.findOne(tourId)

      expect(result).toEqual({
        ...mockTour,
        itinerary: null,
        includes: [],
      })
    })
  })
})
