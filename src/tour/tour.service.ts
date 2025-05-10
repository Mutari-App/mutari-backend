import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { User } from '@prisma/client'

@Injectable()
export class TourService {
  constructor(private readonly prisma: PrismaService) {}

  async createTourView(tourId: string, user: User) {
    const userId = user.id

    const userViews = await this.prisma.tourView.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
    })

    // console.log('itineraryExists', itineraryExists)
    console.log('userViews', userViews)
    console.log('tourId', tourId)
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
}
