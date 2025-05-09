import { Test, TestingModule } from '@nestjs/testing'
import { TourService } from './tour.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { DURATION_TYPE } from '@prisma/client'
import { NotFoundException } from '@nestjs/common'

describe('TourService', () => {
  let service: TourService
  let prisma: PrismaService

  const mockPrismaService = {
    tour: {
      findMany: jest.fn().mockResolvedValue([{ id: '1', title: 'Mock Tour' }]),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    itinerary: {
      findUnique: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TourService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<TourService>(TourService)
    prisma = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

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

      prisma.tour.findUnique = jest.fn().mockResolvedValue(mockTour)
      prisma.itinerary.findUnique = jest.fn().mockResolvedValue(mockItinerary)

      const result = await service.findOne(tourId)

      expect(result).toEqual({
        ...mockTour,
        itinerary: mockItinerary,
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
    })

    it('should throw NotFoundException if tour not found', async () => {
      prisma.tour.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
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

      const result = await service.findOne(tourId)

      expect(result).toEqual({
        ...mockTour,
        itinerary: null,
      })
    })
  })
})
