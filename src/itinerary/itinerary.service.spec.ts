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
              delete: jest.fn(),
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

  describe('removeItinerary', () => {
    it('should remove an itinerary successfully', async () => {
      const itineraryId = 'ITN123'

      prisma.itinerary.findUnique = jest
        .fn()
        .mockResolvedValue({ id: itineraryId })
      prisma.itinerary.delete = jest.fn().mockResolvedValue({ id: itineraryId })

      await expect(service.removeItinerary(itineraryId)).resolves.toEqual({
        id: itineraryId,
      })

      expect(prisma.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })

      expect(prisma.itinerary.delete).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })
    })

    it('should throw NotFoundException if itinerary does not exist', async () => {
      const itineraryId = 'non-existent-id'

      prisma.itinerary.findUnique = jest.fn().mockResolvedValue(null)

      await expect(service.removeItinerary(itineraryId)).rejects.toThrow(
        NotFoundException
      )

      expect(prisma.itinerary.findUnique).toHaveBeenCalledWith({
        where: { id: itineraryId },
      })

      expect(prisma.itinerary.delete).not.toHaveBeenCalled()
    })
  })
})
