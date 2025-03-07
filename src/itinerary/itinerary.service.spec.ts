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
    it('should return itinerary when found', async () => {
      const mockItinerary = {
        id: '123',
        sections: [
          {
            id: '1',
            blocks: [{ id: 'block1' }, { id: 'block2' }],
          },
        ],
      }
      ;(prisma.itinerary.findUnique as jest.Mock).mockResolvedValue(
        mockItinerary
      )
      const result = await service.findOne('123')

      expect(result).toEqual(mockItinerary)
      expect(prisma.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          sections: { include: { blocks: true } },
        },
      })
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      const itineraryId = 'non-existent-id'

      ;(prisma.itinerary.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(service.findOne(itineraryId)).rejects.toThrow(
        NotFoundException
      )
    })
  })
})
