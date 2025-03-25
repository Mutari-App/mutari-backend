import { Controller, Post, Body } from '@nestjs/common'
import { GeminiService } from './gemini.service'
import { GenerateFeedbackDto } from './model/generate-feedback.dto'
import { Public } from 'src/common/decorators/public.decorator'

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Public()
  @Post('generate-feedback')
  async generate(@Body() dto: GenerateFeedbackDto) {
    return this.geminiService.generateFeedback(dto)
  }
}
