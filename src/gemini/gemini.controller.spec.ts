import { Test, TestingModule } from '@nestjs/testing' 
import { GeminiController } from './gemini.controller' 
import { GeminiService } from './gemini.service' 
import { GenerateFeedbackDto } from './model/generate-feedback.dto' 

describe('GeminiController', () => {
  let controller: GeminiController 
  let geminiService: GeminiService 

  const mockGeminiService = {
    generateFeedback: jest.fn(),
  } 

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeminiController],
      providers: [
        {
          provide: GeminiService,
          useValue: mockGeminiService,
        },
      ],
    }).compile()

    controller = module.get<GeminiController>(GeminiController)
    geminiService = module.get<GeminiService>(GeminiService)
  }) 

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should throw an error if itineraryData.sections is empty', async () => {
    const invalidDto: GenerateFeedbackDto = {
      itineraryData: {
        title: 'Trip to Bali',
        description: 'A relaxing trip',
        coverImage: 'bali.jpg',
        startDate: '2025-04-10',
        endDate: '2025-04-15',
        tags: ['beach', 'relax'],
        sections: [],
      },
    } 

    await expect(controller.generate(invalidDto)).rejects.toThrowError(
      'ItineraryData must contain sections.'
    ) 
  }) 

  it('should call geminiService.generateFeedback with valid dto', async () => {
    const validDto: GenerateFeedbackDto = {
      itineraryData: {
        title: 'Trip to Japan',
        description: 'Cultural exploration',
        coverImage: 'japan.jpg',
        startDate: '2025-05-01',
        endDate: '2025-05-10',
        tags: ['culture', 'food'],
        sections: [
          {
            sectionNumber: 1,
            title: 'Day 1 - Tokyo',
            blocks: [
              {
                blockType: 'activity',
                title: 'Visit Sensoji Temple',
                description: 'Explore Asakusa and its surroundings',
                startTime: '09:00',
                endTime: '11:00',
                price: 0,
              },
            ],
          },
        ],
      },
    } 

    const mockResult = { feedback: 'Looks good!' } 
    mockGeminiService.generateFeedback.mockResolvedValue(mockResult) 

    const result = await controller.generate(validDto) 

    expect(geminiService.generateFeedback).toHaveBeenCalledWith(validDto) 
    expect(result).toEqual(mockResult) 
  }) 
}) 
