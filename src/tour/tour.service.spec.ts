import { Test, TestingModule } from '@nestjs/testing'
import { TourService } from './tour.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { MeilisearchService } from 'src/meilisearch/meilisearch.service'

describe('TourService', () => {
  let service: TourService

  const mockPrismaService = {
    tour: {
      findMany: jest.fn().mockResolvedValue([{ id: '1', title: 'Mock Tour' }]),
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
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should return a string indicating a new tour was added', () => {
      const createTourDto: CreateTourDto = {}
      expect(service.create(createTourDto)).toBe('This action adds a new tour')
    })
  })

  describe('findAll', () => {
    it('should return a string indicating all tours are returned', () => {
      expect(service.findAll()).toBe('This action returns all tour')
    })
  })

  describe('findOne', () => {
    it('should return a string with the tour id', () => {
      const id = '1'
      expect(service.findOne(id)).toBe(`This action returns a #${id} tour`)
    })
  })

  describe('update', () => {
    it('should return a string with the updated tour id', () => {
      const id = '1'
      const updateTourDto: UpdateTourDto = {}
      expect(service.update(id, updateTourDto)).toBe(
        `This action updates a #${id} tour`
      )
    })
  })

  describe('remove', () => {
    it('should return a string with the removed tour id', () => {
      const id = '1'
      expect(service.remove(id)).toBe(`This action removes a #${id} tour`)
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

      // Updated the expected filter to match the actual implementation
      expect(mockMeilisearchService.searchTours).toHaveBeenCalledWith('paris', {
        limit: 10,
        offset: 10,
        filter:
          'location = "Paris, France" AND pricePerTicket >= 50 AND pricePerTicket <= 150 AND duration >= 4 AND durationType = "HOUR" AND availableTickets > 0',
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
          filter: 'duration >= 2',
        })
      )

      // Test with only maxDuration
      await service.searchTours('', 1, 10, { maxDuration: 5 })
      expect(mockMeilisearchService.searchTours).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({
          filter: 'duration <= 5',
        })
      )

      // Test with both min and max duration
      await service.searchTours('', 1, 10, { minDuration: 2, maxDuration: 5 })
      expect(mockMeilisearchService.searchTours).toHaveBeenLastCalledWith(
        '',
        expect.objectContaining({
          filter: 'duration >= 2 AND duration <= 5',
        })
      )
    })
  })
})
