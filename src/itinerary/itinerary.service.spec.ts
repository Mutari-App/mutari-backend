import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

describe('ItineraryService', () => {
  let service: ItineraryService
  let prisma: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItineraryService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            itinerary: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<ItineraryService>(ItineraryService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findMyItineraries', () => {
    it('should return paginated itineraries', async () => {
      const mockData = [{ id: 1, userId: 'user1', startDate: new Date() }]
      const mockTotal = 10
      const mockPage = 1
      const mockLimit = PAGINATION_LIMIT

      prisma.$transaction = jest.fn().mockImplementation(async (queries) => {
        return Promise.all(queries)
      })
      prisma.itinerary.findMany = jest.fn().mockResolvedValue(mockData)
      prisma.itinerary.count = jest.fn().mockResolvedValue(mockTotal)

      const result = await service.findMyItineraries('user1', mockPage)

      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: mockPage,
        totalPages: Math.ceil(mockTotal / mockLimit),
      })
    })

    it('should handle invalid page numbers', async () => {
      await expect(service.findMyItineraries('123', -1)).rejects.toThrow(
        'Invalid page number'
      )
      await expect(service.findMyItineraries('123', 0)).rejects.toThrow(
        'Invalid page number'
      )

      const mockTotal = 3
      const fixedLimit = PAGINATION_LIMIT
      const totalPages = Math.ceil(mockTotal / fixedLimit)

      prisma.$transaction = jest.fn().mockImplementation(async (queries) => {
        return Promise.all(queries)
      })
      prisma.itinerary.findMany = jest.fn().mockResolvedValue([])
      prisma.itinerary.count = jest.fn().mockResolvedValue(0)

      await expect(
        service.findMyItineraries('123', totalPages + 1)
      ).rejects.toThrow('Invalid page number')
    })

    it('should return empty list if user has no itineraries', async () => {
      prisma.$transaction = jest.fn().mockImplementation(async (queries) => {
        return Promise.all(queries)
      })
      prisma.itinerary.findMany = jest.fn().mockResolvedValue([])
      prisma.itinerary.count = jest.fn().mockResolvedValue(0)

      const result = await service.findMyItineraries('123', 1)

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
      })
    })
  })
})
