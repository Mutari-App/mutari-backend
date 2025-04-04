import { Controller, Post, Body } from '@nestjs/common'
import { GeminiService } from './gemini.service'
import { GenerateFeedbackDto } from './model/generate-feedback.dto'
import { Public } from 'src/common/decorators/public.decorator'

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate-feedback')
  async generate(@Body() dto: GenerateFeedbackDto) {
    if (
      !dto.itineraryData ||
      !dto.itineraryData.sections ||
      dto.itineraryData.sections.length === 0
    ) {
      throw new Error('ItineraryData must contain sections.')
    }
    return this.geminiService.generateFeedback(dto)
  }
}
