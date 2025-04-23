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
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-05-03'),
    createdAt: new Date('2025-04-10'),
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
  startDate: '2025-05-01T00:00:00.000Z',
  endDate: '2025-05-03T00:00:00.000Z',
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

const mockMeiliSearchIndex = {
  updateSettings: jest.fn().mockResolvedValue({}),
  addDocuments: jest.fn().mockResolvedValue({}),
  deleteDocument: jest.fn().mockResolvedValue({}),
  search: jest.fn().mockResolvedValue({
    hits: [mockFormattedItinerary],
    estimatedTotalHits: 1,
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
    it('should create index if it does not exist', async () => {
      await service.setupIndexes()

      expect(meiliSearch.getIndexes).toHaveBeenCalled()
      expect(meiliSearch.createIndex).toHaveBeenCalledWith('itineraries', {
        primaryKey: 'id',
      })
      expect(mockMeiliSearchIndex.updateSettings).toHaveBeenCalledWith({
        searchableAttributes: [
          'title',
          'description',
          'tags.tag.name',
          'user.firstName',
          'user.lastName',
          'sections.title',
          'sections.blocks.title',
          'sections.blocks.description',
        ],
        filterableAttributes: [
          'tags.tag.id',
          'startDate',
          'endDate',
          'isPublished',
          'daysCount',
          'likes',
        ],
        sortableAttributes: [
          'startDate',
          'endDate',
          'createdAt',
          'likes',
          'daysCount',
        ],
        rankingRules: [
          'words',
          'typo',
          'proximity',
          'attribute',
          'sort',
          'exactness',
        ],
      })
    })

    it('should not create index if it already exists', async () => {
      ;(meiliSearch.getIndexes as jest.Mock).mockResolvedValueOnce({
        results: [{ uid: 'itineraries' }],
      })

      await service.setupIndexes()

      expect(meiliSearch.getIndexes).toHaveBeenCalled()
      expect(meiliSearch.createIndex).not.toHaveBeenCalled()
      expect(mockMeiliSearchIndex.updateSettings).toHaveBeenCalled()
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
        startDate: '2025-05-01T00:00:00.000Z',
        endDate: '2025-05-03T00:00:00.000Z',
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
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-02'),
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
        startDate: '2025-06-01T00:00:00.000Z',
        endDate: '2025-06-02T00:00:00.000Z',
        createdAt: expect.any(String),
        isPublished: true,
        likes: 0,
        daysCount: 0,
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

  describe('calculateDaysCount', () => {
    it('should calculate days count from highest section number', () => {
      const sections = [
        { sectionNumber: 1 },
        { sectionNumber: 3 },
        { sectionNumber: 2 },
      ]

      expect(service['calculateDaysCount'](sections)).toBe(3)
    })

    it('should return 0 for empty sections', () => {
      expect(service['calculateDaysCount']([])).toBe(0)
      expect(service['calculateDaysCount'](null)).toBe(0)
      expect(service['calculateDaysCount'](undefined)).toBe(0)
    })
  })

  describe('searchItineraries', () => {
    it('should search itineraries with the provided query and options', async () => {
      const query = 'Paris'
      const options = {
        filter: 'tags.tag.id = "tag1"',
        sort: ['startDate:asc'],
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
})
