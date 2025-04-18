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
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-05-03'),
    isCompleted: false,
    userId: 'user1',
    createdAt: new Date('2025-04-10'),
    sections: [
      {
        id: 'section1',
        blocks: [
          {
            id: 'block1',
            title: 'Eiffel Tower',
            description: 'Visit the iconic landmark',
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
    ],
    user: {
      id: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      photoProfile: 'profile.jpg',
    },
  },
]

const mockMeiliSearchIndex = {
  updateSettings: jest.fn().mockResolvedValue({}),
  addDocuments: jest.fn().mockResolvedValue({}),
  deleteDocument: jest.fn().mockResolvedValue({}),
  search: jest.fn().mockResolvedValue({ hits: mockItineraries }),
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
          'sections.blocks.title',
          'user.firstName',
          'user.lastName',
        ],
        filterableAttributes: ['tags.tag.name'],
        sortableAttributes: ['startDate', 'endDate', 'createdAt', 'likes'],
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

    it('should handle errors', async () => {
      const error = new Error('Test error')
      ;(meiliSearch.getIndexes as jest.Mock).mockRejectedValueOnce(error)

      await expect(service.setupIndexes()).rejects.toThrow(error)
    })
  })

  describe('syncItineraries', () => {
    it('should fetch itineraries and index them', async () => {
      await service.syncItineraries()

      expect(prisma.itinerary.findMany).toHaveBeenCalled()
      expect(mockMeiliSearchIndex.addDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'itinerary1',
            locationCount: 1,
          }),
        ])
      )
    })

    it('should handle errors', async () => {
      const error = new Error('Sync error')
      ;(prisma.itinerary.findMany as jest.Mock).mockRejectedValueOnce(error)

      await expect(service.syncItineraries()).rejects.toThrow(error)
    })
  })

  describe('searchItineraries', () => {
    it('should search itineraries with the provided query and options', async () => {
      const query = 'Paris'
      const options = { filter: 'userId = user1' }

      const result = await service.searchItineraries(query, options)

      expect(mockMeiliSearchIndex.search).toHaveBeenCalledWith(query, options)
      expect(result.hits).toEqual(mockItineraries)
    })

    it('should handle search errors', async () => {
      const error = new Error('Search error')
      ;(mockMeiliSearchIndex.search as jest.Mock).mockRejectedValueOnce(error)

      await expect(service.searchItineraries('test')).rejects.toThrow(error)
    })
  })

  describe('addOrUpdateItinerary', () => {
    it('should add or update an itinerary in the index', async () => {
      const itinerary = mockItineraries[0]

      await service.addOrUpdateItinerary(itinerary)

      expect(mockMeiliSearchIndex.addDocuments).toHaveBeenCalledWith([
        itinerary,
      ])
    })

    it('should handle errors', async () => {
      const error = new Error('Update error')
      ;(mockMeiliSearchIndex.addDocuments as jest.Mock).mockRejectedValueOnce(
        error
      )

      await expect(
        service.addOrUpdateItinerary(mockItineraries[0])
      ).rejects.toThrow(error)
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

    it('should handle delete errors', async () => {
      const error = new Error('Delete error')
      ;(mockMeiliSearchIndex.deleteDocument as jest.Mock).mockRejectedValueOnce(
        error
      )

      await expect(service.deleteItinerary('itinerary1')).rejects.toThrow(error)
    })
  })
})
