import { Test, TestingModule } from '@nestjs/testing'
import { ProfileService } from './profile.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

describe('ProfileService', () => {
  let service: ProfileService
  let prismaService: PrismaService

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<ProfileService>(ProfileService)
    prismaService = module.get<PrismaService>(PrismaService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOne', () => {
    it('should return a profile by id', async () => {
      // Arrange
      const id = '123'
      const mockUser = {
        id,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      // Act
      const result = await service.findOne(id)

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      })
      expect(result).toEqual({
        id,
        name: 'Test User',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
      expect(result).not.toHaveProperty('email')
      expect(result).not.toHaveProperty('password')
    })

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      const id = 'nonexistent-id'
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(
        new NotFoundException(`User with id ${id} not found`)
      )
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      })
    })
  })
})
