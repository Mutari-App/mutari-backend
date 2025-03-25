import { Test, TestingModule } from '@nestjs/testing'
import { GeminiController } from './gemini.controller'
import { GeminiService } from './gemini.service'
import { GenerateFeedbackDto } from './model/generate-feedback.dto'

describe('GeminiController', () => {
  let geminiController: GeminiController
  let geminiService: GeminiService

  const mockGeminiService = {
    generateFeedback: jest.fn().mockResolvedValue('Mocked feedback response'),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeminiController],
      providers: [{ provide: GeminiService, useValue: mockGeminiService }],
    }).compile()

    geminiController = module.get<GeminiController>(GeminiController)
    geminiService = module.get<GeminiService>(GeminiService)
  })

  it('should be defined', () => {
    expect(geminiController).toBeDefined()
  })

  it('should call generateFeedback and return response', async () => {
    const dto: GenerateFeedbackDto = {
      prompt: 'Improve my public speaking skills',
    }
    const response = await geminiController.generate(dto)

    expect(geminiService.generateFeedback).toHaveBeenCalledWith(dto)
    expect(response).toBe('Mocked feedback response')
  })

  it('should handle service errors', async () => {
    jest
      .spyOn(geminiService, 'generateFeedback')
      .mockRejectedValue(new Error('Service Error'))

    await expect(geminiController.generate({ prompt: 'Test' })).rejects.toThrow(
      'Service Error'
    )
  })
})
