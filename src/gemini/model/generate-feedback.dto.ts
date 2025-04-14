import { BLOCK_TYPE } from '@prisma/client'

export class GenerateFeedbackDto {
  itineraryData: {
    title: string
    description: string
    coverImage: string
    startDate: string
    endDate: string
    tags: string[]
    sections: {
      sectionNumber: number
      title: string
      blocks: {
        id: string
        blockType: BLOCK_TYPE
        title?: string
        description?: string
        startTime?: string
        endTime?: string
        price?: number
      }[]
    }[]
  }
}

export type FeedbackItem = {
  target: {
    sectionIndex: number
    blockIndex: number
    blockType: 'LOCATION' | 'NOTE'
    field?: 'startTime' | 'endTime' | 'price' | 'description' | 'title'
  }
  suggestion: string
}
