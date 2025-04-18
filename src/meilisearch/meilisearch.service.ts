import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { InjectMeiliSearch } from 'nestjs-meilisearch'
import { MeiliSearch } from 'meilisearch'
import { PrismaService } from 'src/prisma/prisma.service'

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
    try {
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

      // Configure searchable attributes
      await this.meiliSearch.index(itinerariesIndex).updateSettings({
        searchableAttributes: [
          'title',
          'description',
          'tags.tag.name',
          'sections.blocks.title',
          'user.firstName',
          'user.lastName',
        ],
        filterableAttributes: ['tags.tag.name'],
        sortableAttributes: ['startDate', 'endDate', 'createdAt', 'likes'],
      })

      this.logger.log('Meilisearch indexes setup complete')
    } catch (error) {
      this.logger.error('Error setting up Meilisearch indexes', error)
      throw error
    }
  }

  async syncItineraries() {
    try {
      const itineraries = await this.prisma.itinerary.findMany({
        include: {
          sections: {
            include: {
              blocks: true,
            },
          },
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
        },
      })

      // Format data for Meilisearch
      const documentsToIndex = itineraries.map((itinerary) => ({
        ...itinerary,
        locationCount: itinerary.sections.reduce(
          (acc, section) => acc + section.blocks.length,
          0
        ),
      }))

      // Index the documents
      await this.meiliSearch.index('itineraries').addDocuments(documentsToIndex)
      this.logger.log(
        `Synced ${documentsToIndex.length} itineraries to Meilisearch`
      )
    } catch (error) {
      this.logger.error('Error syncing itineraries to Meilisearch', error)
      throw error
    }
  }

  async searchItineraries(query: string, options?: any) {
    try {
      return await this.meiliSearch.index('itineraries').search(query, options)
    } catch (error) {
      this.logger.error('Error searching itineraries', error)
      throw error
    }
  }

  async addOrUpdateItinerary(itinerary: any) {
    try {
      await this.meiliSearch.index('itineraries').addDocuments([itinerary])
      this.logger.log(`Added/updated itinerary ${itinerary.id} in Meilisearch`)
    } catch (error) {
      this.logger.error(
        `Error adding/updating itinerary ${itinerary.id}`,
        error
      )
      throw error
    }
  }

  async deleteItinerary(itineraryId: string) {
    try {
      await this.meiliSearch.index('itineraries').deleteDocument(itineraryId)
      this.logger.log(`Deleted itinerary ${itineraryId} from Meilisearch`)
    } catch (error) {
      this.logger.error(`Error deleting itinerary ${itineraryId}`, error)
      throw error
    }
  }
}
