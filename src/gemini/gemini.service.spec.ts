import { Test, TestingModule } from '@nestjs/testing'
import { GeminiService } from './gemini.service'
import { ConfigService } from '@nestjs/config'
import { InternalServerErrorException } from '@nestjs/common'
import { GenerateFeedbackDto } from './model/generate-feedback.dto'

describe('GeminiService', () => {
  let service: GeminiService

  const mockApiKey = 'FAKE-API-KEY'

  const mockGenerateContent = jest.fn()
  const mockModel = {
    generateContent: mockGenerateContent,
  }

  const mockGoogleAI = {
    getGenerativeModel: jest.fn(() => mockModel),
  }

  beforeEach(async () => {
    jest.resetAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => mockApiKey),
          },
        },
      ],
    })
      .overrideProvider(GeminiService)
      .useFactory({
        factory: (configService: ConfigService) => {
          const service = new GeminiService(configService)
          // override GoogleGenerativeAI with mocked version
          ;(service as any).googleAI = mockGoogleAI
          ;(service as any).model = mockModel
          return service
        },
        inject: [ConfigService],
      })
      .compile()

    service = module.get<GeminiService>(GeminiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('generateFeedback', () => {
    const dto: GenerateFeedbackDto = {
      itineraryData: {
        title: 'Trip to Japan',
        description: 'A cultural journey',
        coverImage: 'cover.jpg',
        startDate: '2025-05-01',
        endDate: '2025-05-10',
        tags: ['culture'],
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1',
            blocks: [
              {
                blockType: 'LOCATION',
                title: 'Tokyo Tower',
                startTime: '10:00',
                endTime: '12:00',
                price: 500,
              },
              {
                blockType: 'NOTE',
                description: 'Remember to bring your camera!',
              },
            ],
          },
        ],
      },
    }

    it('should return parsed feedback array from AI response', async () => {
      const mockJson = JSON.stringify([
        {
          target: {
            sectionIndex: 0,
            blockIndex: 0,
            blockType: 'LOCATION',
            field: 'price',
          },
          suggestion:
            'Tambahkan estimasi harga agar pengguna bisa mempersiapkan budget.',
        },
      ])

      const mockResponse = {
        text: () => mockJson,
      }

      mockGenerateContent.mockResolvedValueOnce({
        response: Promise.resolve(mockResponse),
      })

      const result = await service.generateFeedback(dto)

      expect(result).toEqual({
        feedback: [
          {
            target: {
              sectionIndex: 0,
              blockIndex: 0,
              blockType: 'LOCATION',
              field: 'price',
            },
            suggestion:
              'Tambahkan estimasi harga agar pengguna bisa mempersiapkan budget.',
          },
        ],
      })
    })

    it('should parse JSON even if AI returns extra text', async () => {
      const wrappedJson = `
        Berikut adalah saran dari AI:
        [
          {
            "target": {
              "sectionIndex": 0,
              "blockIndex": 1,
              "blockType": "NOTE",
              "field": "description"
            },
            "suggestion": "Bisa ditambahkan catatan lebih detail tentang lokasi."
          }
        ]
        Terima kasih!
      `

      const mockResponse = {
        text: () => wrappedJson,
      }

      mockGenerateContent.mockResolvedValueOnce({
        response: Promise.resolve(mockResponse),
      })

      const result = await service.generateFeedback(dto)

      expect(result.feedback[0].target.blockType).toBe('NOTE')
      expect(result.feedback[0].suggestion).toContain('Bisa ditambahkan')
    })

    it('should throw InternalServerErrorException on AI error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('AI Error'))

      await expect(service.generateFeedback(dto)).rejects.toThrow(
        InternalServerErrorException
      )
    })
  })
})
