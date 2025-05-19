import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { MidtransService } from './midtrans.service'
import * as midtransClient from 'midtrans-client'

// Mock midtrans-client
jest.mock('midtrans-client', () => {
  return {
    Snap: jest.fn().mockImplementation(() => ({
      createTransaction: jest.fn().mockResolvedValue({
        token: 'test-token',
        redirect_url: 'https://example.com/redirect',
      }),
    })),
    CoreApi: jest.fn().mockImplementation(() => ({
      transaction: {
        notification: jest
          .fn()
          .mockResolvedValue({ transaction_status: 'settlement' }),
        status: jest.fn().mockResolvedValue({ transaction_status: 'success' }),
      },
    })),
  }
})

describe('MidtransService', () => {
  let service: MidtransService
  let configService: ConfigService

  const mockConfigService = {
    get: jest.fn((key) => {
      if (key === 'NODE_ENV') return 'development'
      if (key === 'MIDTRANS_SERVER_KEY') return 'test-server-key'
      if (key === 'MIDTRANS_CLIENT_KEY') return 'test-client-key'
      return null
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MidtransService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<MidtransService>(MidtransService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should initialize Snap and CoreApi with correct configuration', () => {
    expect(midtransClient.Snap).toHaveBeenCalledWith({
      isProduction: false,
      serverKey: 'test-server-key',
      clientKey: 'test-client-key',
    })

    expect(midtransClient.CoreApi).toHaveBeenCalledWith({
      isProduction: false,
      serverKey: 'test-server-key',
      clientKey: 'test-client-key',
    })
  })

  it('should create transaction', async () => {
    const params = {
      transaction_details: { order_id: 'test-order', gross_amount: 10000 },
    }
    const result = await service.createTransaction(params)

    expect(result).toEqual({
      token: 'test-token',
      redirect_url: 'https://example.com/redirect',
    })
  })

  it('should create transaction token', async () => {
    const params = {
      transaction_details: { order_id: 'test-order', gross_amount: 10000 },
    }
    const result = await service.createTransactionToken(params)

    expect(result).toBe('test-token')
  })

  it('should create transaction redirect URL', async () => {
    const params = {
      transaction_details: { order_id: 'test-order', gross_amount: 10000 },
    }
    const result = await service.createTransactionRedirectUrl(params)

    expect(result).toBe('https://example.com/redirect')
  })

  it('should handle notification', async () => {
    const notificationJson = { transaction_id: 'test-transaction' }
    const result = await service.handleNotification(notificationJson)

    expect(result).toEqual({ transaction_status: 'settlement' })
  })

  it('should get transaction status', async () => {
    const result = await service.getTransactionStatus('test-transaction-id')

    expect(result).toEqual({ transaction_status: 'success' })
  })
})
