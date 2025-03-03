import { Test, TestingModule } from '@nestjs/testing'
import { ItineraryService } from './itinerary.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

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
            itinerary: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile()

    service = module.get<ItineraryService>(ItineraryService)
    prisma = module.get(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('FindOneItinerary', () => {
    it('should return an itinerary if it exists', async () => {
      const mockItinerary = {
        id: 'ITN123',
        title: 'Trip to Bali',
      }

      ;(prisma.itinerary.findUnique as jest.Mock).mockResolvedValue(
        mockItinerary
      )

      const result = await service.findOne(mockItinerary.id)
      expect(result).toEqual(mockItinerary)
      expect(prisma.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: mockItinerary.id },
      })
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      const itineraryId = 'non-existent-id'

      ;(prisma.itinerary.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.findOne(itineraryId)).rejects.toThrow(
        NotFoundException
      )
      expect(prisma.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
    })
  })
})
