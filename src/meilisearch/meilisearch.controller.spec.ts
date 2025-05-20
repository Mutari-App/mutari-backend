import { Test, TestingModule } from '@nestjs/testing'
import { MeilisearchController } from './meilisearch.controller'
import { MeilisearchService } from './meilisearch.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { HttpStatus, UnauthorizedException } from '@nestjs/common'

describe('MeilisearchController', () => {
  let controller: MeilisearchController
  let meilisearchService: MeilisearchService
  let responseUtil: ResponseUtil

  // Mock original env variable
  const originalEnv = process.env

  beforeEach(async () => {
    // Set up environment variable for tests
    process.env.MEILISEARCH_SYNC_KEY = 'test-api-key'

    const mockMeilisearchService = {
      syncItineraries: jest.fn().mockResolvedValue(undefined),
      syncTours: jest.fn().mockResolvedValue(undefined),
    }

    const mockResponseUtil = {
      response: jest.fn().mockImplementation((params) => params),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeilisearchController],
      providers: [
        {
          provide: MeilisearchService,
          useValue: mockMeilisearchService,
        },
        {
          provide: ResponseUtil,
          useValue: mockResponseUtil,
        },
      ],
    }).compile()

    controller = module.get<MeilisearchController>(MeilisearchController)
    meilisearchService = module.get<MeilisearchService>(MeilisearchService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('syncItineraries', () => {
    it('should sync itineraries when provided with valid API key', async () => {
      // Arrange
      const validApiKey = 'test-api-key'

      // Act
      const result = await controller.syncItineraries(validApiKey)

      // Assert
      expect(meilisearchService.syncItineraries).toHaveBeenCalledTimes(1)
      expect(responseUtil.response).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: 'Itineraries synced successfully',
      })
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Itineraries synced successfully',
      })
    })

    it('should throw UnauthorizedException when provided with invalid API key', async () => {
      // Arrange
      const invalidApiKey = 'invalid-api-key'

      // Act & Assert
      await expect(controller.syncItineraries(invalidApiKey)).rejects.toThrow(
        UnauthorizedException
      )
      expect(meilisearchService.syncItineraries).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when API key is missing', async () => {
      // Act & Assert
      await expect(controller.syncItineraries(undefined)).rejects.toThrow(
        UnauthorizedException
      )
      expect(meilisearchService.syncItineraries).not.toHaveBeenCalled()
    })

    it('should handle service errors properly', async () => {
      // Arrange
      const validApiKey = 'test-api-key'
      const error = new Error('Database connection failed')
      jest
        .spyOn(meilisearchService, 'syncItineraries')
        .mockRejectedValueOnce(error)

      // Act & Assert
      await expect(controller.syncItineraries(validApiKey)).rejects.toThrow(
        error
      )
      expect(meilisearchService.syncItineraries).toHaveBeenCalledTimes(1)
      expect(responseUtil.response).not.toHaveBeenCalled()
    })
  })

  describe('syncTours', () => {
    it('should sync tours when provided with valid API key', async () => {
      // Arrange
      const validApiKey = 'test-api-key'

      // Act
      const result = await controller.syncTours(validApiKey)

      // Assert
      expect(meilisearchService.syncTours).toHaveBeenCalledTimes(1)
      expect(responseUtil.response).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: 'Tours synced successfully',
      })
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Tours synced successfully',
      })
    })

    it('should throw UnauthorizedException when provided with invalid API key', async () => {
      // Arrange
      const invalidApiKey = 'invalid-api-key'

      // Act & Assert
      await expect(controller.syncTours(invalidApiKey)).rejects.toThrow(
        UnauthorizedException
      )
      expect(meilisearchService.syncTours).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when API key is missing', async () => {
      // Act & Assert
      await expect(controller.syncTours(undefined)).rejects.toThrow(
        UnauthorizedException
      )
      expect(meilisearchService.syncTours).not.toHaveBeenCalled()
    })

    it('should handle service errors properly', async () => {
      // Arrange
      const validApiKey = 'test-api-key'
      const error = new Error('Database connection failed')
      jest.spyOn(meilisearchService, 'syncTours').mockRejectedValueOnce(error)

      // Act & Assert
      await expect(controller.syncTours(validApiKey)).rejects.toThrow(error)
      expect(meilisearchService.syncTours).toHaveBeenCalledTimes(1)
      expect(responseUtil.response).not.toHaveBeenCalled()
    })
  })
})
