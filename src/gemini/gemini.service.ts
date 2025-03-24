import { ConfigService } from '@nestjs/config'
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable } from '@nestjs/common'
import { GenerateFeedbackDto } from './model/generate-feedback.dto'

const GEMINI_MODEL = 'gemini-2.0-flash'

@Injectable()
export class GeminiService {
  private readonly googleAI: GoogleGenerativeAI
  private readonly model: GenerativeModel
  constructor(configService: ConfigService) {
    const geminiApiKey = configService.get('GEMINI_API_KEY')
    this.googleAI = new GoogleGenerativeAI(geminiApiKey)
    this.model = this.googleAI.getGenerativeModel({
      model: GEMINI_MODEL,
    })
  }

  async generateFeedback(dto: GenerateFeedbackDto): Promise<string> {
    try {
      const input = `Buat feedback dan saran perbaikan untuk itinerary ini, terutama terkait efisiensi waktu, rekomendasi aktivitas, serta pengalaman yang lebih optimal dari itinerary berikut:\n\nPrompt: "${dto.prompt}", mohon berikan beberapa saran perbaikan untuk itinerary ini dalam bentuk poin-poin saja`

      const result = await this.model.generateContent(input)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Error generating feedback:', error)
      throw new Error('Failed to generate feedback')
    }
  }
}
