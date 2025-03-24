import { Test, TestingModule } from '@nestjs/testing'
import { UmamiService } from './umami.service'
import fetchMock from 'jest-fetch-mock'
fetchMock.enableMocks()

describe('UmamiService', () => {
  let service: UmamiService

  beforeEach(async () => {
    fetchMock.resetMocks()

    // Mock environment variables
    process.env.UMAMI_URL = 'https://mock-umami-url.com'
    process.env.UMAMI_API_KEY = 'mock-api-key'
    process.env.UMAMI_DISCORD_WEBHOOK_URL =
      'https://mock-discord-webhook-url.com'

    const module: TestingModule = await Test.createTestingModule({
      providers: [UmamiService],
    }).compile()

    service = module.get<UmamiService>(UmamiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getUmamiAnalytics', () => {
    it('should fetch analytics data and send to Discord', async () => {
      const mockAnalyticsData = {
        pageviews: { value: 32, prev: 0 },
        visitors: { value: 2, prev: 0 },
        visits: { value: 4, prev: 0 },
        bounces: { value: 0, prev: 0 },
        totaltime: { value: 4863, prev: 0 },
      }

      Object.defineProperty(service, '_getPreviousMonthRange', {
        value: jest.fn().mockReturnValue({
          startAt: 1741824000000,
          endAt: 1742073599000,
        }),
      })

      fetchMock.mockResponseOnce(JSON.stringify(mockAnalyticsData))
      jest.spyOn(service, 'sendToDiscord').mockImplementation(async () => {})

      await service.getUmamiAnalytics()

      expect(fetchMock).toHaveBeenCalledWith(
        `${process.env.UMAMI_URL}?startAt=1741824000000&endAt=1742073599000`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-umami-api-key': process.env.UMAMI_API_KEY ?? '',
          },
          method: 'GET',
        }
      )

      expect(service.sendToDiscord).toHaveBeenCalledWith(mockAnalyticsData)
    })

    it('should handle fetch errors gracefully', async () => {
      Object.defineProperty(service, '_getPreviousMonthRange', {
        value: jest.fn().mockReturnValue({
          startAt: 1625097600000, // Example timestamp
          endAt: 1627776000000, // Example timestamp
        }),
      })

      fetchMock.mockResponseOnce(
        JSON.stringify({
          ok: false,
          statusText: "Cannot read properties of undefined (reading 'value')",
        })
      )

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await service.getUmamiAnalytics()

      expect(fetchMock).toHaveBeenCalledWith(
        `${process.env.UMAMI_URL}?startAt=1625097600000&endAt=1627776000000`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-umami-api-key': process.env.UMAMI_API_KEY ?? '',
          },
          method: 'GET',
        }
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Cannot read properties of undefined (reading 'value')"
      )
    })

    it('should return 401 Unauthorized if UMAMI_API_KEY is not set', async () => {
      const mockAnalyticsData = {
        pageviews: { value: 32, prev: 0 },
        visitors: { value: 2, prev: 0 },
        visits: { value: 4, prev: 0 },
        bounces: { value: 0, prev: 0 },
        totaltime: { value: 4863, prev: 0 },
      }

      // Unset the UMAMI_API_KEY environment variable
      delete process.env.UMAMI_API_KEY

      Object.defineProperty(service, '_getPreviousMonthRange', {
        value: jest.fn().mockReturnValue({
          startAt: 1741824000000,
          endAt: 1742073599000,
        }),
      })

      fetchMock.mockResponseOnce(
        JSON.stringify({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
        })
      )

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      jest.spyOn(service, 'sendToDiscord').mockImplementation(async () => {})

      await service.getUmamiAnalytics()

      expect(fetchMock).toHaveBeenCalledWith(
        `${process.env.UMAMI_URL}?startAt=1741824000000&endAt=1742073599000`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-umami-api-key': '',
          },
          method: 'GET',
        }
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error: Cannot read properties of undefined (reading 'value')"
      )
    })
  })

  describe('_getPreviousMonthRange', () => {
    it('should return the correct start and end timestamps for the previous month', () => {
      const now = new Date('2025-03-24T12:48:22.493Z')
      jest
        .spyOn(global, 'Date')
        .mockImplementation(() => now as unknown as Date)

      const { startAt, endAt } = service._getPreviousMonthRange()

      expect(startAt).toBe(new Date('2025-02-01T00:00:00.000Z').getTime())
      expect(endAt).toBe(new Date('2025-02-28T23:59:59.999Z').getTime())
    })
  })
})
