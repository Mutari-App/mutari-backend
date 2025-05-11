import { Test, TestingModule } from '@nestjs/testing'
import { TourService } from './tour.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { User } from '@prisma/client'
import { NotFoundException } from '@nestjs/common'

describe('TourService', () => {
  let service: TourService
  let prismaService: PrismaService

  const mockUser: User = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: new Date(),
    email: 'john@example.com',
    phoneNumber: '123456789',
    password: 'hashedpassword',
    photoProfile: null,
    referralCode: null,
    isEmailConfirmed: false,
    referredById: null,
    loyaltyPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockPrismaService = {
    tour: {
      findMany: jest.fn().mockResolvedValue([{ id: '1', title: 'Mock Tour' }]),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tourView: {
      findMany: jest.fn(),
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
    prismaService = module.get<PrismaService>(PrismaService)

    service = module.get<TourService>(TourService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getTourView', () => {
    it('should return list of tour views ordered by viewedAt desc', async () => {
      const user = { id: 'user123' }

      const now = new Date()

      const expectedResultFromDb = [
        {
          tourId: 'a',
          viewedAt: now,
          tour: {
            id: 'a',
            title: 'Sample tour A',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
        {
          tourId: 'b',
          viewedAt: now,
          tour: {
            id: 'b',
            title: 'Sample tour B',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
      ]

      mockPrismaService.tourView.findMany.mockResolvedValue(
        expectedResultFromDb
      )

      const result = await service.getTourView(user as any)

      expect(mockPrismaService.tourView.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: user.id },
          orderBy: { viewedAt: 'desc' },
          include: expect.objectContaining({
            tour: true,
          }),
        })
      )

      expect(result).toEqual([
        {
          tourId: 'a',
          viewedAt: now,
          tour: {
            id: 'a',
            title: 'Sample tour A',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
        {
          tourId: 'b',
          viewedAt: now,
          tour: {
            id: 'b',
            title: 'Sample tour B',
            description: null,
            coverImage: '',
            createdAt: now,
            userId: 'user1',
          },
        },
      ])
    })
  })

  describe('createTourView', () => {
    it('should update viewedAt if tour already viewed', async () => {
      const tours = [{ tourId: 'tour-1' }]
      const tourViews = [{ tourId: 'tour-1', userId: 'user-123' }]
      mockPrismaService.tour.findMany.mockResolvedValue(tours)
      mockPrismaService.tour.findUnique.mockResolvedValue(tours[0])
      mockPrismaService.tourView.findMany.mockResolvedValue(tourViews)

      await service.createTourView('tour-1', mockUser)

      expect(mockPrismaService.tourView.update).toHaveBeenCalledWith({
        where: {
          userId_tourId: {
            userId: 'user-123',
            tourId: 'tour-1',
          },
        },
        data: { viewedAt: expect.any(Date) },
      })
    })

    it('should throw NotFoundException if tour doesnt exist', async () => {
      const tours = [{ tourId: 'tour-1' }]
      const tourViews = [{ tourId: 'tour-1', userId: 'user-123' }]
      mockPrismaService.tour.findMany.mockResolvedValue(tours)
      mockPrismaService.tour.findUnique.mockResolvedValue(null)
      mockPrismaService.tourView.findMany.mockResolvedValue(tourViews)

      await expect(
        service.createTourView('not-existing-tour', mockUser)
      ).rejects.toBeInstanceOf(NotFoundException)

      expect(mockPrismaService.tour.findUnique).toHaveBeenCalledWith({
        where: { id: 'not-existing-tour' },
      })
      expect(mockPrismaService.tourView.update).not.toHaveBeenCalled()
      expect(mockPrismaService.tourView.create).not.toHaveBeenCalled()
      expect(mockPrismaService.tourView.delete).not.toHaveBeenCalled()
    })

    it('should delete oldest view if already 10 and add new', async () => {
      const userViews = Array.from({ length: 10 }).map((_, i) => ({
        id: `view-${i}`,
        tourId: `it-${i}`,
      }))
      const tours = [{ tourId: 'tour-1' }]

      mockPrismaService.tourView.findMany.mockResolvedValue(userViews)
      mockPrismaService.tour.findUnique.mockResolvedValue(tours[0])
      mockPrismaService.tourView.create.mockResolvedValue({})

      await service.createTourView('new-tour', mockUser)

      expect(mockPrismaService.tourView.delete).toHaveBeenCalledWith({
        where: { id: 'view-9' }, // assumed last in list is oldest
      })
      expect(mockPrismaService.tourView.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          tourId: 'new-tour',
          viewedAt: expect.any(Date),
        },
      })
    })

    it('should just create view if less than 10 views', async () => {
      const userViews = Array.from({ length: 5 }).map((_, i) => ({
        id: `view-${i}`,
        tourId: `tour-${i}`,
      }))
      const tours = [{ tourId: 'tour-1' }]

      mockPrismaService.tourView.findMany.mockResolvedValue(userViews)
      mockPrismaService.tourView.create.mockResolvedValue({})
      mockPrismaService.tour.findUnique.mockResolvedValue(tours[0])

      await service.createTourView('it-100', mockUser)

      expect(mockPrismaService.tourView.delete).not.toHaveBeenCalled()
      expect(mockPrismaService.tourView.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          tourId: 'it-100',
          viewedAt: expect.any(Date),
        },
      })
    })
  })
})
