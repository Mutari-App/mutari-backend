import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common'
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

  scheduleEmail(data: EmailScheduleDto) {
    const scheduledDate = this._calculateScheduleDate(
      data.startDate,
      data.reminderOption
    )
    const subject = `Reminder for ${data.tripName}`
    const jobName = `${data.itineraryId}-${data.recipient}`
    const job = new CronJob(scheduledDate, () => {
      this.emailService.sendEmail(
        data.recipient,
        subject,
        itineraryReminderTemplate(
          data.recipientName,
          data.tripName,
          data.reminderOption
        )
      )
    })

    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      throw new ConflictException(
        `Failed to schedule job for itinerary ${data.itineraryId}: already scheduled`
      )
    }
    this.schedulerRegistry.addCronJob(jobName, job)
    try {
      job.start()
    } catch (error) {
      throw new BadRequestException(
        `Failed to schedule job for itinerary ${data.itineraryId}: date in past`
      )
    }
  }

  _calculateScheduleDate(startDate: string, reminderOption: REMINDER_OPTION) {
    let scheduledDate = new Date(startDate)
    let dateOffset: number = 0
    if (reminderOption == 'TEN_MINUTES_BEFORE') {
      dateOffset = 1000 * 60 * 10
    } else if (reminderOption == 'ONE_HOUR_BEFORE') {
      dateOffset = 1000 * 60 * 60
    } else if (reminderOption == 'ONE_DAY_BEFORE') {
      dateOffset = 1000 * 60 * 60 * 24
    } else {
      throw new BadRequestException('Invalid reminder option')
    }
    scheduledDate.setTime(scheduledDate.getTime() - dateOffset)
    return scheduledDate
  }

  /**
   * Creates a new ItineraryReminder and saves it
   */
  async create(data: CreateItineraryReminderDto) {
    await this._checkItineraryExists(data.itineraryId)
    await this._checkItineraryReminderExists(data.itineraryId, false)
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

  async update(data: UpdateItineraryReminderDto) {
    await this._checkItineraryExists(data.itineraryId)
    await this._checkItineraryReminderExists(data.itineraryId, true)

    return this.prisma.$transaction(async (prisma) => {
      const reminder = await prisma.itineraryReminder.update({
        where: { itineraryId: data.itineraryId },
        data: {
          email: data.email,
          reminderOption: data.reminderOption,
        },
      })
      return reminder
    })
  }

  remove(id: number) {
    return `This action removes a #${id} notification`
  }

  async _checkItineraryReminderExists(
    itineraryId: string,
    requiresFound: boolean
  ) {
    const reminder = await this.prisma.itineraryReminder.findUnique({
      where: { itineraryId: itineraryId },
    })

    if (requiresFound && !reminder) {
      throw new NotFoundException(
        `Itinerary with ID ${itineraryId} doesn't have a reminder`
      )
    }
    if (!requiresFound && reminder) {
      throw new ConflictException(
        `Itinerary with ID ${itineraryId} already has a reminder`
      )
    }

    return reminder
  }

  async _checkItineraryExists(itineraryId: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id: itineraryId },
    })

    if (!itinerary) {
      throw new NotFoundException(
        `Itinerary with ID ${itineraryId} does not exist`
      )
    }
  }
}
