import { ConfigService } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { GeminiService } from './gemini.service'
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { GenerateFeedbackDto } from './model/generate-feedback.dto'

describe('GeminiService', () => {
  let geminiService: GeminiService
  let mockConfigService: ConfigService
  let mockGenerativeAI: GoogleGenerativeAI
  let mockGenerativeModel: GenerativeModel

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('FAKE_API_KEY'),
    } as unknown as ConfigService

    mockGenerativeModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Mocked feedback response'),
        },
      }),
    } as unknown as GenerativeModel

    mockGenerativeAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockGenerativeModel),
    } as unknown as GoogleGenerativeAI

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GoogleGenerativeAI, useValue: mockGenerativeAI },
      ],
    }).compile()

    geminiService = module.get<GeminiService>(GeminiService)
  })

  it('should be defined', () => {
    expect(geminiService).toBeDefined()
  })

  // it('should generate feedback successfully', async () => {
  //   const dto: GenerateFeedbackDto = {
  //     prompt:
  //       'Hari 1: Tiba di Bandara Ngurah Rai, check-in hotel, makan malam di Jimbaran. Hari 2: Mengunjungi Ubud Monkey Forest, eksplorasi Ubud. Hari 3: Snorkeling di Nusa Penida, menikmati pantai Kelingking. Hari 4: Wisata budaya ke Pura Besakih dan Tirta Empul. Hari 5: Bersantai di Pantai Seminyak, menikmati sunset. Hari 6: Belanja oleh-oleh di Pasar Sukawati, menikmati kuliner lokal. Hari 7: Kembali ke Jakarta',
  //   }

  //   const result = await geminiService.generateFeedback(dto)

  //   expect(typeof result).toBe('string')
  //   expect(result.length).toBeGreaterThan(0)
  // })

  it('should handle errors in generateFeedback', async () => {
    (mockGenerativeModel.generateContent as jest.Mock).mockRejectedValue(
      new Error('API Error')
    )

    await expect(
      geminiService.generateFeedback({ prompt: 'Test' })
    ).rejects.toThrow('Failed to generate feedback')
  })
})
