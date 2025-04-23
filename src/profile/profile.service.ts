import { Injectable, NotFoundException } from '@nestjs/common'
import { BLOCK_TYPE } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        photoProfile: true,
        firstName: true,
        lastName: true,
        referralCode: true,
        _count: {
          select: { referrals: true, itineraries: true }, // Menghitung jumlah referrals
        },
        loyaltyPoints: true,
        itineraries: {
          select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            startDate: true,
            endDate: true,
            _count: {
              select: {
                likes: true,
              },
            },
            sections: {
              select: {
                _count: {
                  select: {
                    blocks: {
                      where: {
                        blockType: BLOCK_TYPE.LOCATION,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        itineraryLikes: {
          select: {
            itinerary: {
              select: {
                id: true,
                title: true,
                description: true,
                coverImage: true,
                startDate: true,
                endDate: true,
                _count: {
                  select: {
                    likes: true,
                  },
                },
                sections: {
                  select: {
                    _count: {
                      select: {
                        blocks: {
                          where: {
                            blockType: BLOCK_TYPE.LOCATION,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!user) throw new NotFoundException(`User with id ${id} not found`)

    let totalLikes = 0
    // Calculate total destinations for each itinerary
    const enrichedItineraries = user.itineraries.map((itinerary) => {
      const totalDestinations = itinerary.sections.reduce((total, section) => {
        return total + section._count.blocks
      }, 0)

      // Remove sections from the returned object
      const {
        sections: _sections,
        _count,
        ...itineraryWithoutSections
      } = itinerary

      totalLikes += _count.likes // Accumulate total likes

      return {
        ...itineraryWithoutSections,
        totalLikes: _count.likes,
        totalDestinations,
      }
    })

    // Calculate total destinations for each liked itinerary
    const enrichedLikedItineraries = user.itineraryLikes.map((like) => {
      const totalDestinations = like.itinerary.sections.reduce(
        (total, section) => {
          return total + section._count.blocks
        },
        0
      )

      // Remove sections from the itinerary object
      const {
        sections: _sections,
        _count,
        ...itineraryWithoutSections
      } = like.itinerary

      return {
        ...itineraryWithoutSections,
        totalLikes: _count.likes,
        totalDestinations,
      }
    })

    // Extract _count.referrals as totalReferrals
    const { _count, ...userWithoutCount } = user
    return {
      ...userWithoutCount,
      totalReferrals: _count.referrals,
      totalItineraries: _count.itineraries,
      totalLikes,
      itineraries: enrichedItineraries,
      itineraryLikes: enrichedLikedItineraries,
    }
  }
}
