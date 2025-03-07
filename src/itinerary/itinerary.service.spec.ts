import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { PAGINATION_LIMIT } from 'src/common/constants/itinerary.constant'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { NotFoundException, ForbiddenException } from '@nestjs/common'

describe('ItineraryService', () => {
  let service: ItineraryService
  let prisma: PrismaService

  const mockItineraryData = {
    id: '1',
    userId: 'user1',
    title: 'Itinerary Mock',
    description: 'This is a mocked itinerary',
    coverImage: 'image.jpg',
    startDate: new Date(),
    endDate: new Date(),
    isPublished: false,
    isCompleted: false,
  }

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
      const mockData = [mockItineraryData]
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
        metadata: {
          total: mockTotal,
          page: mockPage,
          totalPages: Math.ceil(mockTotal / mockLimit),
        },
      })
    })

    it('should handle negative page numbers', async () => {
      try {
        await service.findMyItineraries('123', -1)
      } catch (error) {
        expect(error.message).toBe('Invalid page number')
      }
    })

    it('should handle overflow page numbers', async () => {
      const mockTotal = 3
      const fixedLimit = PAGINATION_LIMIT
      const totalPages = Math.ceil(mockTotal / fixedLimit)

      prisma.$transaction = jest.fn().mockImplementation(async (queries) => {
        return Promise.all(queries)
      })
      prisma.itinerary.findMany = jest.fn().mockResolvedValue([])
      prisma.itinerary.count = jest.fn().mockResolvedValue(0)

      try {
        await service.findMyItineraries('123', totalPages + 1)
      } catch (error) {
        expect(error.message).toBe('Page number exceeds total available pages')
      }
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
        metadata: {
          total: 0,
          page: 1,
          totalPages: 1,
        },
      })
    })
  })

  describe('findMyCompletedItineraries', () => {
    it('should return completed itineraries with locationCount', async () => {
      // Mock data yang akan dikembalikan Prisma
      const mockItineraries = [
        {
          id: 'itinerary-1',
          userId: 'user-1',
          title: 'Trip ke Jepang',
          isCompleted: true,
          startDate: new Date(),
          sections: [
            { blocks: [{ blockType: 'LOCATION' }, { blockType: 'LOCATION' }] },
            { blocks: [{ blockType: 'LOCATION' }] },
          ],
        },
        {
          id: 'itinerary-2',
          userId: 'user-1',
          title: 'Trip ke Bali',
          isCompleted: true,
          startDate: new Date(),
          sections: [{ blocks: [{ blockType: 'LOCATION' }] }],
        },
      ]

      // Set mock return value
      prisma.itinerary.findMany = jest.fn().mockResolvedValue(mockItineraries)

      // Panggil fungsi yang akan diuji
      const result = await service.findMyCompletedItineraries('user-1')

      // Cek hasilnya sesuai dengan ekspektasi
      expect(result).toEqual([
        {
          id: 'itinerary-1',
          userId: 'user-1',
          title: 'Trip ke Jepang',
          isCompleted: true,
          startDate: expect.any(Date),
          sections: expect.any(Array),
          locationCount: 3, // Total lokasi dalam itinerary ini
        },
        {
          id: 'itinerary-2',
          userId: 'user-1',
          title: 'Trip ke Bali',
          isCompleted: true,
          startDate: expect.any(Date),
          sections: expect.any(Array),
          locationCount: 1, // Total lokasi dalam itinerary ini
        },
      ])

      // Pastikan findMany terpanggil dengan benar
      expect(prisma.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isCompleted: true },
        orderBy: { startDate: 'asc' },
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
              },
            },
          },
        },
      })
    })

    it('should return an empty array when there are no completed itineraries', async () => {
      // Mock return value kosong
      prisma.itinerary.findMany = jest.fn().mockResolvedValue([])

      const result = await service.findMyCompletedItineraries('user-2')

      expect(result).toEqual([])
      expect(prisma.itinerary.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-2', isCompleted: true },
        orderBy: { startDate: 'asc' },
        include: {
          sections: {
            include: {
              blocks: {
                where: { blockType: 'LOCATION' },
              },
            },
          },
        },
      })
    })
  })

  describe('markAsComplete', () => {
    it('should mark itinerary as complete', async () => {
      prisma.itinerary.findUnique = jest
        .fn()
        .mockResolvedValue(mockItineraryData)
      prisma.itinerary.update = jest.fn().mockResolvedValue({
        ...mockItineraryData,
        isCompleted: true,
      })

      const result = await service.markAsComplete('1', 'user1')

      expect(prisma.itinerary.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isCompleted: true },
      })

      expect(result.isCompleted).toBe(true)
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      prisma.itinerary.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.markAsComplete('1', 'user1')).rejects.toThrow(
        NotFoundException
      )
    })

    it('should throw ForbiddenException if user is not the owner', async () => {
      const mockItinerary = { id: '1', userId: '999', isCompleted: false }

      prisma.itinerary.findUnique = jest.fn().mockResolvedValue(mockItinerary)

      await expect(service.markAsComplete('1', 'user1')).rejects.toThrow(
        ForbiddenException
      )
    })
  })
})
