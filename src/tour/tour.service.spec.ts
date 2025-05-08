import { Test, TestingModule } from '@nestjs/testing'
import { TourService } from './tour.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'

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
})
