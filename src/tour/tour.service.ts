import { Injectable } from '@nestjs/common'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'
import { PrismaService } from 'src/prisma/prisma.service'
import { MeilisearchService } from 'src/meilisearch/meilisearch.service'

@Injectable()
export class TourService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearchService: MeilisearchService
  ) {}

  create(createTourDto: CreateTourDto) {
    return 'This action adds a new tour'
  }

  findAll() {
    return `This action returns all tour`
  }

  findOne(id: string) {
    return `This action returns a #${id} tour`
  }

  update(id: string, updateTourDto: UpdateTourDto) {
    return `This action updates a #${id} tour`
  }

  remove(id: string) {
    return `This action removes a #${id} tour`
  }

  async searchTours(
    query: string = '',
    page: number = 1,
    limit: number = 20,
    filters?: {
      location?: string
      minPrice?: number
      maxPrice?: number
      minDuration?: number
      maxDuration?: number
      durationType?: string
      hasAvailableTickets?: boolean
    },
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ) {
    const offset = (page - 1) * limit

    // Build filter string
    let filterConditions = []

    if (filters?.location) {
      filterConditions.push(`location = "${filters.location}"`)
    }

    if (filters?.minPrice !== undefined) {
      filterConditions.push(`pricePerTicket >= ${filters.minPrice}`)
    }

    if (filters?.maxPrice !== undefined) {
      filterConditions.push(`pricePerTicket <= ${filters.maxPrice}`)
    }

    if (filters?.minDuration !== undefined) {
      filterConditions.push(`duration >= ${filters.minDuration}`)
    }

    if (filters?.maxDuration !== undefined) {
      filterConditions.push(`duration <= ${filters.maxDuration}`)
    }

    if (filters?.durationType) {
      filterConditions.push(`durationType = "${filters.durationType}"`)
    }

    // Only show tours with available tickets if requested
    if (filters?.hasAvailableTickets) {
      filterConditions.push(`availableTickets > 0`)
    }

    const filterString = filterConditions.length
      ? [[...filterConditions]]
      : undefined

    const searchOptions = {
      limit,
      offset,
      filter: filterString,
      sort: [`${sortBy}:${order}`],
    }

    const result = await this.meilisearchService.searchTours(
      query,
      searchOptions
    )

    return {
      data: result.hits.map((hit) => ({
        id: hit.id,
        title: hit.title,
        coverImage: hit.coverImage,
        maxCapacity: hit.maxCapacity,
        description: hit.description,
        location: hit.location,
        pricePerTicket: hit.pricePerTicket,
        duration: hit.duration,
        durationType: hit.durationType,
        availableTickets: hit.availableTickets,
        includes: hit.includes,
        itinerary: hit.itinerary,
        user: hit.user,
      })),
      metadata: {
        total: result.estimatedTotalHits,
        page,
        totalPages: Math.ceil(result.estimatedTotalHits / limit) || 1,
      },
    }
  }
}
