import { ConfigService } from '@nestjs/config'
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  FeedbackItem,
  GenerateFeedbackDto,
} from './model/generate-feedback.dto'

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

  async createPrompt(
    itineraryData: GenerateFeedbackDto['itineraryData']
  ): Promise<{ prompt: string }> {
    const { title, description, sections } = itineraryData

    const formatter = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    })

    const sectionSummaries = sections
      .map((section, sectionIndex) => {
        if (!section.blocks || section.blocks.length === 0) {
          return `Hari ${sectionIndex + 1}: ${section.title} → (Tidak ada aktivitas)`
        }

        const activities = section.blocks
          .map((block) => {
            const id = block.id
            if (block.blockType === 'LOCATION') {
              const start = block.startTime
                ? formatter.format(new Date(block.startTime))
                : '-'
              const end = block.endTime
                ? formatter.format(new Date(block.endTime))
                : '-'

              return `Hari ${sectionIndex + 1}, Block ID ${id}: LOCATION - "${block.title}" (${start} sampai ${end}) Rp${block.price || 0} - "${block.description}"`
            } else if (block.blockType === 'NOTE') {
              return `Hari ${sectionIndex + 1}, Block ID ${id}: NOTE - "${block.description}"`
            }
            return ''
          })
          .filter(Boolean)
          .join('\n')

        return activities
      })
      .join('\n')

    return {
      prompt: `
      Berikut adalah itinerary dengan detail aktivitas per hari dan per blok:
      
      Judul: "${title}"
      Deskripsi: "${description || 'Tidak ada deskripsi'}"
      
      Aktivitas:
      ${sectionSummaries}
      
      Tugas kamu:
      - Analisa itinerary ini dan berikan saran perbaikan yang singkat.
      - Format jawaban **HARUS** berupa array JSON.
      - Masing-masing item dalam array harus mengandung:
        {
          "target": {
            "sectionIndex": number,
            "blockId": string,
            "blockType": "LOCATION" atau "NOTE",
            "field": "time" | "price" | "description" | "title" (opsional)
          },
          "suggestion": "saran perbaikan maksimal 1-2 kalimat"
        }
      
      Contoh:
      [
        {
          "target": {
            "sectionIndex": 1,
            "blockId": BLK-123,
            "blockType": "LOCATION",
            "field": "price"
          },
          "suggestion": "Tambahkan estimasi harga agar pengguna bisa mempersiapkan budget."
        }
      ]
      
      Perhatikan bahwa sectionIndex dimulai dari 1 dan blockIndex dimulai dari 0.
      Berikan maksimal 5 saran. Jika semuanya sudah baik, kembalikan array kosong [].
      Jangan menambahkan teks apapun di luar JSON.`,
    }
  }

  async generateFeedback(
    dto: GenerateFeedbackDto
  ): Promise<{ feedback: FeedbackItem[] }> {
    try {
      const prompt = await this.createPrompt(dto.itineraryData)
      const result = await this.model.generateContent(prompt.prompt)
      const response = await result.response
      const feedbackText = await response.text()

      let feedbackArray: FeedbackItem[]

      try {
        feedbackArray = JSON.parse(feedbackText)
      } catch (e) {
        const jsonStart = feedbackText.indexOf('[')
        const jsonEnd = feedbackText.lastIndexOf(']')
        const jsonString = feedbackText.slice(jsonStart, jsonEnd + 1)
        feedbackArray = JSON.parse(jsonString)
      }

      return { feedback: feedbackArray }
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to generate feedback from AI'
      )
    }
  }
}
