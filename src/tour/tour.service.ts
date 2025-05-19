import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { MeilisearchService } from 'src/meilisearch/meilisearch.service'
import { PAYMENT_STATUS, User } from '@prisma/client'
import { BuyTourTicketDTO } from './dto/buy-tour-ticket.dto'
// import { MidtransService } from 'src/midtrans/midtrans.service'
import { DokuService } from 'src/doku/doku.service'

@Injectable()
export class TourService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearchService: MeilisearchService,
    // private readonly midtransService: MidtransService
    private readonly dokuService: DokuService
  ) {}

  async createTourView(tourId: string, user: User) {
    const userId = user.id

    const tourExists = await this.prisma.tour.findUnique({
      where: { id: tourId },
    })

    if (!tourExists) {
      throw new NotFoundException('Tour not found')
    }

    const userViews = await this.prisma.tourView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
    })

    const itineraryExists = userViews.some((view) => view.tourId === tourId)

    if (itineraryExists) {
      return this.prisma.tourView.update({
        where: {
          userId_tourId: { userId, tourId },
        },
        data: {
          viewedAt: new Date(),
        },
      })
    }

    if (userViews.length >= 10) {
      await this.prisma.tourView.delete({
        where: {
          id: userViews[userViews.length - 1].id,
        },
      })
    }

    return this.prisma.tourView.create({
      data: {
        userId,
        tourId,
        viewedAt: new Date(),
      },
    })
  }

  async getTourView(user: User) {
    const userId = user.id
    const views = await this.prisma.tourView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      include: {
        tour: true,
      },
    })

    return views
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

    const hasDurationType = filters?.durationType !== undefined
    const hasMinDuration = filters?.minDuration !== undefined
    const hasMaxDuration = filters?.maxDuration !== undefined

    // Only apply durationType filter if it's provided
    if (hasDurationType) {
      filterConditions.push(`durationType = "${filters.durationType}"`)

      // When durationType is specified, also apply any duration filters
      if (hasMinDuration) {
        filterConditions.push(`duration >= ${filters.minDuration}`)
      }

      if (hasMaxDuration) {
        filterConditions.push(`duration <= ${filters.maxDuration}`)
      }
    } else if (hasMinDuration || hasMaxDuration) {
      const durationFilters = []
      // For days
      const dayFilters = []
      if (hasMinDuration) dayFilters.push(`duration >= ${filters.minDuration}`)
      if (hasMaxDuration) dayFilters.push(`duration <= ${filters.maxDuration}`)
      if (dayFilters.length > 0) {
        durationFilters.push([...dayFilters, `durationType = "DAY"`])
      }
      // For hours
      const hourFilters = []
      if (hasMinDuration) hourFilters.push(`duration >= ${filters.minDuration}`)
      if (hasMaxDuration) hourFilters.push(`duration <= ${filters.maxDuration}`)
      if (hourFilters.length > 0) {
        durationFilters.push([...hourFilters, `durationType = "HOUR"`])
      }
      // Add the duration filters as a nested OR condition
      if (durationFilters.length > 0) {
        filterConditions.push(durationFilters)
      }
    }

    // Only show tours with available tickets if requested
    if (filters?.hasAvailableTickets) {
      filterConditions.push(`availableTickets > 0`)
    }

    const filterString = filterConditions.length ? filterConditions : undefined

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

  async findOne(id: string) {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
    })

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`)
    }

    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: tour.itineraryId },
      include: {
        sections: {
          include: {
            blocks: true,
          },
        },
      },
    })

    const includes = await this.prisma.tourIncludes.findMany({
      where: { tourId: id },
    })

    const result = {
      ...tour,
      itinerary: itinerary ? { ...itinerary } : null,
      includes,
    }

    return result
  }

  async buyTourTicket(
    tourId: string,
    buyTourTicketDto: BuyTourTicketDTO,
    user: User
  ) {
    if (buyTourTicketDto.quantity !== buyTourTicketDto.visitors.length) {
      throw new BadRequestException('Quantity and visitors count mismatch')
    }

    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    })

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${tourId} not found`)
    }

    if (buyTourTicketDto.visitors.length > tour.maxCapacity) {
      throw new BadRequestException(`Tour capacity exceeded`)
    }

    if (buyTourTicketDto.visitors.length > tour.availableTickets) {
      throw new BadRequestException(`Not enough tickets available`)
    }

    const { customer, visitors, quantity, tourDate } = buyTourTicketDto

    const {
      firstName: customerFirstName,
      lastName: customerLastName,
      email: customerEmail,
      phoneNumber: customerPhoneNumber,
      title: customerTitle,
    } = customer

    const tourTicket = await this.prisma.tourTicket.create({
      data: {
        tourDate: new Date(tourDate),
        customerEmail,
        customerFirstName,
        customerLastName,
        customerPhoneNumber,
        customerTitle,
        quantity,
        totalPrice: quantity * tour.pricePerTicket,
        tour: {
          connect: {
            id: tourId,
          },
        },
        guests: {
          createMany: {
            data: visitors.map((visitor) => ({
              firstName: visitor.firstName,
              lastName: visitor.lastName,
              email: visitor.email,
              phoneNumber: visitor.phoneNumber,
              title: visitor.title,
            })),
          },
        },
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })

    return tourTicket
  }

  async payTourTicket(id: string, user) {
    const tourTicket = await this.prisma.tourTicket.findUnique({
      where: { id },
    })
    if (!tourTicket) {
      throw new NotFoundException(`Tour ticket with ID ${id} not found`)
    }
    if (tourTicket.userId !== user.id) {
      throw new BadRequestException(`You are not authorized to pay this ticket`)
    }
    if (tourTicket.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new BadRequestException(`Tour ticket already paid`)
    }

    const transactionDetails = await this.dokuService.getOrderStatus(id)
    if (transactionDetails.transaction.status === 'SUCCESS') {
      const updatedTourTicket = await this.prisma.tourTicket.update({
        where: { id },
        data: {
          paymentStatus: PAYMENT_STATUS.PAID,
        },
      })
      return updatedTourTicket
    } else {
      throw new BadRequestException(transactionDetails.status_message)
    }
  }
}
