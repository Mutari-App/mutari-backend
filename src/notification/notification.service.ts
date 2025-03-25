import { Injectable } from '@nestjs/common'
import { EmailService } from '../email/email.service'
import { UpdateItineraryReminderDto } from './dto/update-itinerary-reminder.dto'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { itineraryReminderTemplate } from './templates/itinerary-reminder-template'
import { PrismaService } from 'src/prisma/prisma.service'
import { REMINDER_OPTION } from '@prisma/client'
import { CreateItineraryReminderDto } from './dto/create-itinerary-reminder.dto'
import { EmailScheduleDto } from './dto/email-schedule.dto'

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {}

  /**
   * Creates a new ItineraryReminder and saves it
   */
  async create(data: CreateItineraryReminderDto) {
    return this.prisma.$transaction(async (prisma) => {
      const reminder = await prisma.itineraryReminder.create({
        data: {
          itineraryId: data.itineraryId,
          email: data.email,
          reminderOption: data.reminderOption,
        },
      })
      return reminder
    })
  }

  findAll() {
    return `This action returns all notification`
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`
  }

  update(id: number, updateNotificationDto: UpdateItineraryReminderDto) {
    return `This action updates a #${id} notification`
  }

  remove(id: number) {
    return `This action removes a #${id} notification`
  }
}
