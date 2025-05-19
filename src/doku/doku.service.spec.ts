import { Test, TestingModule } from '@nestjs/testing'
import { DokuService } from './doku.service'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

describe('DokuService', () => {
  let service: DokuService
  let configService: ConfigService

  const mockedUuid = 'fccaee9c-d613-40cc-a1e4-12a596fad604'

  const mockConfigValues = {
    NODE_ENV: 'development',
    DOKU_CLIENT_ID: 'test-client-id',
    DOKU_CLIENT_SECRET: 'test-secret-key',
  }

  beforeEach(async () => {
    // Mock the global fetch function
    global.fetch = jest.fn()

    // Mock crypto functions
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(mockedUuid)
    jest.spyOn(crypto, 'createHmac').mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue(Buffer.from('mocked-signature')),
    } as any)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DokuService,
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((key: string) => mockConfigValues[key]),
          },
        },
      ],
    }).compile()

    service = module.get<DokuService>(DokuService)
    configService = module.get<ConfigService>(ConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('constructor', () => {
    it('should set baseUrl to sandbox in development environment', () => {
      expect((service as any).baseUrl).toBe('https://api-sandbox.doku.com')
    })

    it('should set baseUrl to production in production environment', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production'
        return mockConfigValues[key]
      })

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DokuService,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile()

      const prodService = module.get<DokuService>(DokuService)
      expect((prodService as any).baseUrl).toBe('https://api.doku.com')
    })
  })

  describe('getOrderStatus', () => {
    it('should call fetch with the correct parameters and return the result', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ status: 'SUCCESS' }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      const result = await service.getOrderStatus('invoice-123')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-sandbox.doku.com/orders/v1/status/invoice-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Client-Id': 'test-client-id',
            'Request-Id': mockedUuid,
            Signature: expect.stringContaining('HMACSHA256='),
          }),
        })
      )
      expect(result).toEqual({ status: 'SUCCESS' })
    })

    it('should throw an error when the API response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not Found'),
      }
      ;(global.fetch as jest.Mock).mockResolvedValue(mockResponse)

      await expect(service.getOrderStatus('invoice-123')).rejects.toThrow(
        'DOKU API error: 404 - Not Found'
      )
    })
  })

  describe('generateRequestId', () => {
    it('should return a UUID', () => {
      const requestId = (service as any).generateRequestId()
      expect(requestId).toBe(mockedUuid)
      expect(crypto.randomUUID).toHaveBeenCalled()
    })
  })

  describe('generateSignature', () => {
    it('should generate the correct signature', () => {
      const signature = (service as any).generateSignature(
        'test-request-id',
        '2023-01-01T00:00:00.000Z',
        '/orders/v1/status/invoice-123',
        'test-client-id'
      )

      // Verify that HMAC was called with the correct parameters
      expect(crypto.createHmac).toHaveBeenCalledWith(
        'sha256',
        'test-secret-key'
      )

      // Verify that the component signature format is correct
      const hmacUpdateSpy = crypto.createHmac('sha256', '').update as jest.Mock
      expect(hmacUpdateSpy).toHaveBeenCalledWith(
        'Client-Id:test-client-id\n' +
          'Request-Id:test-request-id\n' +
          'Request-Timestamp:2023-01-01T00:00:00.000Z\n' +
          'Request-Target:/orders/v1/status/invoice-123'
      )

      // Verify the base64 encoding
      expect(signature).toBe('bW9ja2VkLXNpZ25hdHVyZQ==')
    })
  })
})
