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

// Adding interface for indexed tour data
export interface IndexedTour {
  id: string
  title: string
  coverImage: string | null
  maxCapacity: number
  description: string | null
  location: string
  pricePerTicket: number
  duration: number
  durationType: string
  createdAt: string
  availableTickets: number
  includes: Array<{
    icon: string
    text: string
  }>
  itinerary: {
    id: string
    title: string
    coverImage: string | null
  }
  user: {
    id: string
    firstName: string
    lastName: string
    photoProfile: string | null
  }
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
    const toursIndex = 'tours'

    const indexes = await this.meiliSearch.getIndexes()

    // Setup itineraries index
    const itineraryIndexExists = indexes.results.some(
      (index) => index.uid === itinerariesIndex
    )

    if (!itineraryIndexExists) {
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

    // Setup tours index
    const tourIndexExists = indexes.results.some(
      (index) => index.uid === toursIndex
    )

    if (!tourIndexExists) {
      await this.meiliSearch.createIndex(toursIndex, {
        primaryKey: 'id',
      })
      this.logger.log(`Created index: ${toursIndex}`)
    }

    await this.meiliSearch.index(toursIndex).updateSettings({
      searchableAttributes: [
        'title',
        'description',
        'location',
        'itinerary.title',
        'user.firstName',
        'user.lastName',
        'includes.text',
      ],
      filterableAttributes: [
        'location',
        'pricePerTicket',
        'duration',
        'durationType',
        'availableTickets',
      ],
      sortableAttributes: [
        'createdAt',
        'pricePerTicket',
        'duration',
        'availableTickets',
      ],
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

  async syncTours() {
    const tours = await this.prisma.tour.findMany({
      include: {
        includes: true,
        tickets: true,
        itinerary: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                photoProfile: true,
              },
            },
          },
        },
      },
    })

    const documentsToIndex = tours.map((tour) => this.formatTourForIndex(tour))

    if (documentsToIndex.length > 0) {
      await this.meiliSearch.index('tours').addDocuments(documentsToIndex)
      this.logger.log(`Synced ${documentsToIndex.length} tours to Meilisearch`)
    } else {
      this.logger.log('No tours to sync')
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
      daysCount: this.calculateDaysCount(
        itinerary.startDate,
        itinerary.endDate
      ),
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

  // Helper method to format a tour for the search index
  formatTourForIndex(tour: any): IndexedTour {
    if (!tour) {
      this.logger.error('Cannot format undefined tour for index')
      return null
    }

    return {
      id: tour.id,
      title: tour.title,
      coverImage: tour.coverImage ?? null,
      maxCapacity: tour.maxCapacity,
      description: tour.description ?? null,
      location: tour.location,
      pricePerTicket: parseFloat(tour.pricePerTicket.toString()),
      duration: tour.duration,
      durationType: tour.durationType,
      createdAt:
        tour.createdAt instanceof Date
          ? tour.createdAt.toISOString()
          : (tour.createdAt ?? new Date().toISOString()),
      availableTickets: tour.availableTickets ?? 0,
      includes: Array.isArray(tour.includes)
        ? tour.includes.map((include) => ({
            icon: include.icon,
            text: include.text,
          }))
        : [],
      itinerary: {
        id: tour.itinerary.id,
        title: tour.itinerary.title,
        coverImage: tour.itinerary.coverImage ?? null,
      },
      user: {
        id: tour.itinerary.user.id,
        firstName: tour.itinerary.user.firstName,
        lastName: tour.itinerary.user.lastName,
        photoProfile: tour.itinerary.user.photoProfile ?? null,
      },
    }
  }

  // Helper method to calculate days count from date range
  private calculateDaysCount(
    startDate: Date | string,
    endDate: Date | string
  ): number {
    // If either date is missing, fallback to 1 day
    if (!startDate || !endDate) return 1

    // Convert string dates to Date objects if needed
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)

    // Reset time components to calculate full days only
    const startDateOnly = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    )
    const endDateOnly = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
    )

    // Calculate the time difference in milliseconds
    const timeDiff = endDateOnly.getTime() - startDateOnly.getTime()

    // Convert to days and add 1 (inclusive of both start and end dates)
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1

    // Return at least 1 day, even if dates are the same
    return Math.max(1, daysDiff)
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

  async searchTours(query: string, options?: any) {
    return await this.meiliSearch.index('tours').search(query, options)
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

  async addOrUpdateTour(tour: any) {
    if (!tour) {
      this.logger.error('Cannot add/update undefined tour to search index')
      return
    }

    const documentToIndex = this.formatTourForIndex(tour)
    await this.meiliSearch.index('tours').addDocuments([documentToIndex])
    this.logger.log(`Added/updated tour ${tour.id} in Meilisearch`)
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

  async deleteTour(tourId: string) {
    try {
      await this.meiliSearch.index('tours').deleteDocument(tourId)
      this.logger.log(`Deleted tour ${tourId} from Meilisearch`)
    } catch (error) {
      // Only suppress "document not found" errors
      if (
        error?.message?.includes('Document') &&
        error?.message?.includes('not found')
      ) {
        this.logger.log(`Tour ${tourId} not found in index, skipping delete`)
        return
      }
      // Re-throw other errors for the global handler
      throw error
    }
  }
}
