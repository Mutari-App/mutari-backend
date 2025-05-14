import { Test, TestingModule } from '@nestjs/testing'
import { MeilisearchService } from './meilisearch.service'
import { MeiliSearch } from 'meilisearch'
import { PrismaService } from 'src/prisma/prisma.service'
import { Logger } from '@nestjs/common'
import { MEILI_CLIENT } from 'nestjs-meilisearch'

const mockItineraries = [
  {
    id: 'itinerary1',
    title: 'Paris Trip',
    description: 'A weekend in Paris',
    coverImage: 'paris.jpg',
    createdAt: new Date('2025-04-10'),
    startDate: new Date('2025-04-15'),
    endDate: new Date('2025-04-16'),
    isPublished: true,
    likes: [{ id: 'like1' }, { id: 'like2' }],
    sections: [
      {
        id: 'section1',
        sectionNumber: 1,
        title: 'Day 1 in Paris',
        blocks: [
          {
            id: 'block1',
            title: 'Eiffel Tower',
            description: 'Visit the iconic landmark',
            location: 'Paris, France',
          },
          {
            id: 'block2',
            title: 'Louvre Museum',
            description: 'See the Mona Lisa',
            location: 'Rue de Rivoli, Paris',
          },
        ],
      },
      {
        id: 'section2',
        sectionNumber: 2,
        title: 'Day 2 in Paris',
        blocks: [
          {
            id: 'block3',
            title: 'Notre Dame',
            description: 'Visit the cathedral',
            location: 'Paris, France',
          },
        ],
      },
    ],
    tags: [
      {
        id: 'tagRelation1',
        tag: {
          id: 'tag1',
          name: 'Europe',
        },
      },
      {
        id: 'tagRelation2',
        tag: {
          id: 'tag2',
          name: 'City Break',
        },
      },
    ],
    user: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      photoProfile: 'profile.jpg',
    },
  },
]

// Mock formatted itinerary for index
const mockFormattedItinerary = {
  id: 'itinerary1',
  title: 'Paris Trip',
  description: 'A weekend in Paris',
  coverImage: 'paris.jpg',
  createdAt: '2025-04-10T00:00:00.000Z',
  isPublished: true,
  likes: 2,
  daysCount: 2,
  user: {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    photoProfile: 'profile.jpg',
  },
  tags: [
    {
      tag: {
        id: 'tag1',
        name: 'Europe',
      },
    },
    {
      tag: {
        id: 'tag2',
        name: 'City Break',
      },
    },
  ],
  sections: [
    {
      id: 'section1',
      sectionNumber: 1,
      title: 'Day 1 in Paris',
      blocks: [
        {
          id: 'block1',
          title: 'Eiffel Tower',
          description: 'Visit the iconic landmark',
          location: 'Paris, France',
        },
        {
          id: 'block2',
          title: 'Louvre Museum',
          description: 'See the Mona Lisa',
          location: 'Rue de Rivoli, Paris',
        },
      ],
    },
    {
      id: 'section2',
      sectionNumber: 2,
      title: 'Day 2 in Paris',
      blocks: [
        {
          id: 'block3',
          title: 'Notre Dame',
          description: 'Visit the cathedral',
          location: 'Paris, France',
        },
      ],
    },
  ],
}

// Add mock tour data
const mockTours = [
  {
    id: 'tour1',
    title: 'Paris City Tour',
    coverImage: 'paris-tour.jpg',
    maxCapacity: 20,
    description: 'Guided tour of Paris highlights',
    location: 'Paris, France',
    pricePerTicket: '99.99',
    duration: 8,
    durationType: 'HOUR',
    availableTickets: 15,
    createdAt: new Date('2025-04-10'),
    includes: [
      {
        id: 'include1',
        icon: 'food',
        text: 'Lunch included',
      },
      {
        id: 'include2',
        icon: 'hotel',
        text: 'Hotel pickup',
      },
    ],
    tickets: [],
    itinerary: {
      id: 'itinerary1',
      title: 'Paris Trip',
      coverImage: 'paris.jpg',
      user: {
        id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        photoProfile: 'profile.jpg',
      },
    },
  },
]

// Mock formatted tour for index
const mockFormattedTour = {
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
  createdAt: '2025-04-10T00:00:00.000Z',
  includes: [
    {
      icon: 'food',
      text: 'Lunch included',
    },
    {
      icon: 'hotel',
      text: 'Hotel pickup',
    },
  ],
  itinerary: {
    id: 'itinerary1',
    title: 'Paris Trip',
    coverImage: 'paris.jpg',
  },
  user: {
    id: 'user1',
    firstName: 'John',
    lastName: 'Doe',
    photoProfile: 'profile.jpg',
  },
}

const mockMeiliSearchIndex = {
  updateSettings: jest.fn().mockResolvedValue({}),
  addDocuments: jest.fn().mockResolvedValue({}),
  deleteDocument: jest.fn().mockResolvedValue({}),
  search: jest.fn().mockImplementation((query, options) => {
    // Return appropriate data based on the index being searched
    if (
      mockMeiliSearch.index.mock.calls[
        mockMeiliSearch.index.mock.calls.length - 1
      ][0] === 'tours'
    ) {
      return Promise.resolve({
        hits: [mockFormattedTour],
        estimatedTotalHits: 1,
      })
    }

    return Promise.resolve({
      hits: [mockFormattedItinerary],
      estimatedTotalHits: 1,
    })
  }),
}

const mockMeiliSearch = {
  getIndexes: jest.fn().mockResolvedValue({
    results: [],
  }),
  createIndex: jest.fn().mockResolvedValue({}),
  index: jest.fn().mockReturnValue(mockMeiliSearchIndex),
}

const mockPrismaService = {
  itinerary: {
    findMany: jest.fn().mockResolvedValue(mockItineraries),
  },
  tour: {
    findMany: jest.fn().mockResolvedValue(mockTours),
  },
}

describe('MeilisearchService', () => {
  let service: MeilisearchService
  let meiliSearch: MeiliSearch
  let prisma: PrismaService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeilisearchService,
        {
          provide: MEILI_CLIENT,
          useValue: mockMeiliSearch,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<MeilisearchService>(MeilisearchService)
    meiliSearch = module.get<MeiliSearch>(MEILI_CLIENT)
    prisma = module.get<PrismaService>(PrismaService)

    // Mock Logger to prevent console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {})
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {})
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should call setupIndexes on module init', async () => {
      const setupIndexesSpy = jest
        .spyOn(service, 'setupIndexes')
        .mockResolvedValue(undefined)

      await service.onModuleInit()

      expect(setupIndexesSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('setupIndexes', () => {
    it('should create itinerary and tour indexes if they do not exist', async () => {
      await service.setupIndexes()

      expect(meiliSearch.getIndexes).toHaveBeenCalled()
      expect(meiliSearch.createIndex).toHaveBeenCalledWith('itineraries', {
        primaryKey: 'id',
      })
      expect(meiliSearch.createIndex).toHaveBeenCalledWith('tours', {
        primaryKey: 'id',
      })
      expect(mockMeiliSearchIndex.updateSettings).toHaveBeenCalledTimes(2)
    })

    it('should not create index if it already exists', async () => {
      ;(meiliSearch.getIndexes as jest.Mock).mockResolvedValueOnce({
        results: [{ uid: 'itineraries' }, { uid: 'tours' }],
      })

      await service.setupIndexes()

      expect(meiliSearch.getIndexes).toHaveBeenCalled()
      expect(meiliSearch.createIndex).not.toHaveBeenCalled()
      expect(mockMeiliSearchIndex.updateSettings).toHaveBeenCalledTimes(2)
    })
  })

  describe('formatItineraryForIndex', () => {
    it('should correctly format an itinerary for indexing', () => {
      const formattedItinerary = service.formatItineraryForIndex(
        mockItineraries[0]
      )

      expect(formattedItinerary).toEqual({
        id: 'itinerary1',
        title: 'Paris Trip',
        description: 'A weekend in Paris',
        coverImage: 'paris.jpg',
        createdAt: '2025-04-10T00:00:00.000Z',
        isPublished: true,
        likes: 2,
        daysCount: 2,
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          photoProfile: 'profile.jpg',
        },
        tags: [
          {
            tag: {
              id: 'tag1',
              name: 'Europe',
            },
          },
          {
            tag: {
              id: 'tag2',
              name: 'City Break',
            },
          },
        ],
        sections: expect.any(Array),
      })

      // Check sections are formatted correctly
      expect(formattedItinerary.sections[0].blocks).toHaveLength(2)
      expect(formattedItinerary.sections[1].blocks).toHaveLength(1)
    })

    it('should handle missing fields gracefully', () => {
      const partialItinerary = {
        id: 'partial1',
        title: 'Partial Trip',
        isPublished: true,
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
        },
      }

      const formattedItinerary =
        service.formatItineraryForIndex(partialItinerary)

      expect(formattedItinerary).toEqual({
        id: 'partial1',
        title: 'Partial Trip',
        description: null,
        coverImage: null,
        createdAt: expect.any(String),
        isPublished: true,
        likes: 0,
        daysCount: 1, // Default to 1 day when no dates provided
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          photoProfile: null,
        },
        tags: [],
        sections: [],
      })
    })

    it('should handle null or undefined itinerary and return null', () => {
      // Test with undefined
      const formattedUndefined = service.formatItineraryForIndex(undefined)
      expect(formattedUndefined).toBeNull()
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Cannot format undefined itinerary for index'
      )

      // Reset the mock to check for null case
      jest.clearAllMocks()

      // Test with null
      const formattedNull = service.formatItineraryForIndex(null)
      expect(formattedNull).toBeNull()
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Cannot format undefined itinerary for index'
      )
    })
  })

  describe('formatTourForIndex', () => {
    it('should correctly format a tour for indexing', () => {
      const formattedTour = service.formatTourForIndex(mockTours[0])

      expect(formattedTour).toEqual({
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
        createdAt: '2025-04-10T00:00:00.000Z',
        includes: [
          {
            icon: 'food',
            text: 'Lunch included',
          },
          {
            icon: 'hotel',
            text: 'Hotel pickup',
          },
        ],
        itinerary: {
          id: 'itinerary1',
          title: 'Paris Trip',
          coverImage: 'paris.jpg',
        },
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          photoProfile: 'profile.jpg',
        },
      })
    })

    it('should handle missing fields gracefully', () => {
      const partialTour = {
        id: 'tour2',
        title: 'Simple Tour',
        location: 'London',
        pricePerTicket: '49.99',
        duration: 2,
        durationType: 'HOUR',
        maxCapacity: 10,
        itinerary: {
          id: 'itinerary2',
          title: 'London Trip',
          user: {
            id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      }

      const formattedTour = service.formatTourForIndex(partialTour)

      expect(formattedTour).toEqual({
        id: 'tour2',
        title: 'Simple Tour',
        coverImage: null,
        maxCapacity: 10,
        description: null,
        location: 'London',
        pricePerTicket: 49.99,
        duration: 2,
        durationType: 'HOUR',
        availableTickets: 0,
        createdAt: expect.any(String),
        includes: [],
        itinerary: {
          id: 'itinerary2',
          title: 'London Trip',
          coverImage: null,
        },
        user: {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          photoProfile: null,
        },
      })
    })

    it('should handle null or undefined tour and return null', () => {
      // Test with undefined
      const formattedUndefined = service.formatTourForIndex(undefined)
      expect(formattedUndefined).toBeNull()
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Cannot format undefined tour for index'
      )

      // Reset the mock to check for null case
      jest.clearAllMocks()

      // Test with null
      const formattedNull = service.formatTourForIndex(null)
      expect(formattedNull).toBeNull()
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Cannot format undefined tour for index'
      )
    })
  })

  describe('syncItineraries', () => {
    it('should fetch published itineraries and index them', async () => {
      await service.syncItineraries()

      expect(prisma.itinerary.findMany).toHaveBeenCalledWith({
        where: {
          isPublished: true,
        },
        include: expect.objectContaining({
          tags: expect.any(Object),
          user: expect.any(Object),
          sections: expect.any(Object),
          likes: true,
        }),
      })

      expect(mockMeiliSearchIndex.addDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'itinerary1',
            daysCount: 2,
            likes: 2,
          }),
        ])
      )
    })

    it('should not index if no published itineraries', async () => {
      ;(prisma.itinerary.findMany as jest.Mock).mockResolvedValueOnce([])

      await service.syncItineraries()

      expect(mockMeiliSearchIndex.addDocuments).not.toHaveBeenCalled()
    })
  })

  describe('syncTours', () => {
    it('should fetch tours and index them', async () => {
      await service.syncTours()

      expect(prisma.tour.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          includes: true,
          tickets: true,
          itinerary: expect.any(Object),
        }),
      })

      expect(mockMeiliSearchIndex.addDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'tour1',
            title: 'Paris City Tour',
            location: 'Paris, France',
          }),
        ])
      )
    })

    it('should not index if no tours', async () => {
      ;(prisma.tour.findMany as jest.Mock).mockResolvedValueOnce([])

      await service.syncTours()

      expect(mockMeiliSearchIndex.addDocuments).not.toHaveBeenCalled()
    })
  })

  describe('calculateDaysCount', () => {
    it('should calculate days count from date range', () => {
      // Two-day trip (Apr 15-16, 2025)
      expect(
        service['calculateDaysCount'](
          new Date('2025-04-15'),
          new Date('2025-04-16')
        )
      ).toBe(2)

      // Same day trip
      expect(
        service['calculateDaysCount'](
          new Date('2025-04-15'),
          new Date('2025-04-15')
        )
      ).toBe(1)

      // Multi-day trip
      expect(
        service['calculateDaysCount'](
          new Date('2025-04-15'),
          new Date('2025-04-20')
        )
      ).toBe(6)
    })

    it('should handle time components correctly', () => {
      // Same day with different times should still be 1 day
      expect(
        service['calculateDaysCount'](
          new Date('2025-04-15T08:00:00'),
          new Date('2025-04-15T20:00:00')
        )
      ).toBe(1)

      // Different days with times should count full days
      expect(
        service['calculateDaysCount'](
          new Date('2025-04-15T20:00:00'),
          new Date('2025-04-17T08:00:00')
        )
      ).toBe(3)
    })

    it('should handle string dates', () => {
      expect(service['calculateDaysCount']('2025-04-15', '2025-04-17')).toBe(3)
    })

    it('should return 1 for missing dates', () => {
      expect(service['calculateDaysCount'](null, null)).toBe(1)
      expect(service['calculateDaysCount'](undefined, undefined)).toBe(1)
      expect(service['calculateDaysCount'](new Date('2025-04-15'), null)).toBe(
        1
      )
      expect(service['calculateDaysCount'](null, new Date('2025-04-15'))).toBe(
        1
      )
    })
  })

  describe('searchItineraries', () => {
    it('should search itineraries with the provided query and options', async () => {
      const query = 'Paris'
      const options = {
        filter: 'tags.tag.id = "tag1"',
        sort: ['createdAt:asc'],
      }

      const result = await service.searchItineraries(query, options)

      expect(mockMeiliSearchIndex.search).toHaveBeenCalledWith(query, {
        ...options,
        filter: 'isPublished = true AND (tags.tag.id = "tag1")',
      })
      expect(result).toEqual({
        hits: [mockFormattedItinerary],
        estimatedTotalHits: 1,
      })
    })

    it('should add isPublished filter when no other filters', async () => {
      await service.searchItineraries('test', {})

      expect(mockMeiliSearchIndex.search).toHaveBeenCalledWith('test', {
        filter: 'isPublished = true',
      })
    })
  })

  describe('searchTours', () => {
    it('should search tours with the provided query and options', async () => {
      const query = 'Paris'
      const options = {
        filter: 'location = "Paris, France"',
        sort: ['pricePerTicket:asc'],
      }

      const result = await service.searchTours(query, options)

      expect(mockMeiliSearchIndex.search).toHaveBeenCalledWith(query, options)
      expect(result).toEqual({
        hits: [mockFormattedTour],
        estimatedTotalHits: 1,
      })
    })
  })

  describe('addOrUpdateItinerary', () => {
    it('should add a published itinerary to the index', async () => {
      const itinerary = { ...mockItineraries[0], isPublished: true }
      const formatSpy = jest
        .spyOn(service, 'formatItineraryForIndex')
        .mockReturnValue(mockFormattedItinerary)

      await service.addOrUpdateItinerary(itinerary)

      expect(formatSpy).toHaveBeenCalledWith(itinerary)
      expect(mockMeiliSearchIndex.addDocuments).toHaveBeenCalledWith([
        mockFormattedItinerary,
      ])
    })

    it('should delete an unpublished itinerary from the index', async () => {
      const itinerary = {
        ...mockItineraries[0],
        isPublished: false,
        id: 'itinerary1',
      }
      const deleteSpy = jest
        .spyOn(service, 'deleteItinerary')
        .mockResolvedValue(undefined)

      await service.addOrUpdateItinerary(itinerary)

      expect(mockMeiliSearchIndex.addDocuments).not.toHaveBeenCalled()
      expect(deleteSpy).toHaveBeenCalledWith('itinerary1')
    })

    it('should handle undefined itinerary gracefully', async () => {
      await service.addOrUpdateItinerary(undefined)

      expect(mockMeiliSearchIndex.addDocuments).not.toHaveBeenCalled()
      expect(mockMeiliSearchIndex.deleteDocument).not.toHaveBeenCalled()
    })
  })

  describe('addOrUpdateTour', () => {
    it('should add a tour to the index', async () => {
      const tour = { ...mockTours[0] }
      const formatSpy = jest
        .spyOn(service, 'formatTourForIndex')
        .mockReturnValue(mockFormattedTour)

      await service.addOrUpdateTour(tour)

      expect(formatSpy).toHaveBeenCalledWith(tour)
      expect(mockMeiliSearchIndex.addDocuments).toHaveBeenCalledWith([
        mockFormattedTour,
      ])
    })

    it('should handle undefined tour gracefully', async () => {
      await service.addOrUpdateTour(undefined)

      expect(mockMeiliSearchIndex.addDocuments).not.toHaveBeenCalled()
    })
  })

  describe('deleteItinerary', () => {
    it('should delete an itinerary from the index', async () => {
      const itineraryId = 'itinerary1'

      await service.deleteItinerary(itineraryId)

      expect(mockMeiliSearchIndex.deleteDocument).toHaveBeenCalledWith(
        itineraryId
      )
    })

    it('should handle document not found gracefully', async () => {
      const error = new Error('Document itinerary1 not found')
      ;(mockMeiliSearchIndex.deleteDocument as jest.Mock).mockRejectedValueOnce(
        error
      )

      await expect(service.deleteItinerary('itinerary1')).resolves.not.toThrow()
    })

    it('should throw other errors', async () => {
      const error = new Error('Connection error')
      ;(mockMeiliSearchIndex.deleteDocument as jest.Mock).mockRejectedValueOnce(
        error
      )

      await expect(service.deleteItinerary('itinerary1')).rejects.toThrow(error)
    })
  })

  describe('deleteTour', () => {
    it('should delete a tour from the index', async () => {
      const tourId = 'tour1'

      await service.deleteTour(tourId)

      expect(mockMeiliSearchIndex.deleteDocument).toHaveBeenCalledWith(tourId)
    })

    it('should handle document not found gracefully', async () => {
      const error = new Error('Document tour1 not found')
      ;(mockMeiliSearchIndex.deleteDocument as jest.Mock).mockRejectedValueOnce(
        error
      )

      await expect(service.deleteTour('tour1')).resolves.not.toThrow()
    })

    it('should throw other errors', async () => {
      const error = new Error('Connection error')
      ;(mockMeiliSearchIndex.deleteDocument as jest.Mock).mockRejectedValueOnce(
        error
      )

      await expect(service.deleteTour('tour1')).rejects.toThrow(error)
    })
  })
})
