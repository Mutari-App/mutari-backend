import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { InjectMeiliSearch } from 'nestjs-meilisearch'
import { MeiliSearch } from 'meilisearch'
import { PrismaService } from 'src/prisma/prisma.service'

export interface IndexedItinerary {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  createdAt: string
  isPublished: boolean
  likes: number
  daysCount: number
  user: {
    id: string
    firstName: string
    lastName: string
    photoProfile: string | null
  }
  tags: Array<{
    tag: {
      id: string
      name: string
    }
  }>
  sections: Array<{
    id: string
    sectionNumber: number
    title: string
    blocks: Array<{
      id: string
      title: string | null
      description: string | null
      location: string | null
    }>
  }>
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name)

  constructor(
    @InjectMeiliSearch() private readonly meiliSearch: MeiliSearch,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    await this.setupIndexes()
  }

  async setupIndexes() {
    // Create itineraries index if it doesn't exist
    const itinerariesIndex = 'itineraries'

    const indexes = await this.meiliSearch.getIndexes()
    const indexExists = indexes.results.some(
      (index) => index.uid === itinerariesIndex
    )

    if (!indexExists) {
      await this.meiliSearch.createIndex(itinerariesIndex, {
        primaryKey: 'id',
      })
      this.logger.log(`Created index: ${itinerariesIndex}`)
    }

    await this.meiliSearch.index(itinerariesIndex).updateSettings({
      searchableAttributes: [
        'title',
        'description',
        'tags.tag.name',
        'user.firstName',
        'user.lastName',
        'sections.title',
        'sections.blocks.title',
        'sections.blocks.description',
      ],
      filterableAttributes: [
        'tags.tag.id',
        'isPublished',
        'daysCount',
        'likes',
      ],
      sortableAttributes: ['createdAt', 'likes', 'daysCount'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
    })

    this.logger.log('Meilisearch indexes setup complete')
  }

  async syncItineraries() {
    const itineraries = await this.prisma.itinerary.findMany({
      where: {
        isPublished: true, // Only index published itineraries
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoProfile: true,
          },
        },
        sections: {
          include: {
            blocks: {
              select: {
                id: true,
                title: true,
                description: true,
                location: true,
              },
            },
          },
        },
        likes: true,
      },
    })

    const documentsToIndex = itineraries.map((itinerary) =>
      this.formatItineraryForIndex(itinerary)
    )

    if (documentsToIndex.length > 0) {
      await this.meiliSearch.index('itineraries').addDocuments(documentsToIndex)
      this.logger.log(
        `Synced ${documentsToIndex.length} published itineraries to Meilisearch`
      )
    } else {
      this.logger.log('No published itineraries to sync')
    }
  }

  // Helper method to format an itinerary for the search index
  formatItineraryForIndex(itinerary: any): IndexedItinerary {
    if (!itinerary) {
      this.logger.error('Cannot format undefined itinerary for index')
      return null
    }

    return {
      id: itinerary.id,
      title: itinerary.title,
      description: itinerary.description ?? null,
      coverImage: itinerary.coverImage ?? null,
      createdAt:
        itinerary.createdAt instanceof Date
          ? itinerary.createdAt.toISOString()
          : (itinerary.createdAt ?? new Date().toISOString()),
      isPublished: itinerary.isPublished,
      likes: Array.isArray(itinerary.likes)
        ? itinerary.likes.length
        : itinerary.likes || 0,
      daysCount: this.calculateDaysCount(itinerary.sections),
      user: {
        id: itinerary.user.id,
        firstName: itinerary.user.firstName,
        lastName: itinerary.user.lastName,
        photoProfile: itinerary.user.photoProfile ?? null,
      },
      tags: Array.isArray(itinerary.tags)
        ? itinerary.tags.map((tagRel) => ({
            tag: {
              id: tagRel.tag.id,
              name: tagRel.tag.name,
            },
          }))
        : [],
      sections: Array.isArray(itinerary.sections)
        ? itinerary.sections.map((section) => ({
            id: section.id,
            sectionNumber: section.sectionNumber,
            title: section.title,
            blocks: Array.isArray(section.blocks)
              ? section.blocks.map((block) => ({
                  id: block.id,
                  title: block.title,
                  description: block.description,
                  location: block.location,
                }))
              : [],
          }))
        : [],
    }
  }

  // Helper method to calculate days count from sections
  private calculateDaysCount(sections: any[]): number {
    if (!sections || !Array.isArray(sections) || sections.length === 0) return 0
    return Math.max(...sections.map((section) => section.sectionNumber))
  }

  async searchItineraries(query: string, options?: any) {
    // Always filter for published itineraries in the search
    const searchOptions = {
      ...options,
      filter: options.filter
        ? `isPublished = true AND (${options.filter})`
        : 'isPublished = true',
    }
    return await this.meiliSearch
      .index('itineraries')
      .search(query, searchOptions)
  }

  async addOrUpdateItinerary(itinerary: any) {
    if (!itinerary) {
      this.logger.error('Cannot add/update undefined itinerary to search index')
      return
    }
    // If itinerary is published, add/update it in the index
    if (itinerary.isPublished) {
      const documentToIndex = this.formatItineraryForIndex(itinerary)
      await this.meiliSearch
        .index('itineraries')
        .addDocuments([documentToIndex])
      this.logger.log(
        `Added/updated published itinerary ${itinerary.id} in Meilisearch`
      )
    } else {
      // If itinerary is unpublished, remove it from the index
      await this.deleteItinerary(itinerary.id)
    }
  }

  async deleteItinerary(itineraryId: string) {
    try {
      await this.meiliSearch.index('itineraries').deleteDocument(itineraryId)
      this.logger.log(`Deleted itinerary ${itineraryId} from Meilisearch`)
    } catch (error) {
      // Only suppress "document not found" errors
      if (
        error?.message?.includes('Document') &&
        error?.message?.includes('not found')
      ) {
        this.logger.log(
          `Itinerary ${itineraryId} not found in index, skipping delete`
        )
        return
      }
      // Re-throw other errors for the global handler
      throw error
    }
  }
}
