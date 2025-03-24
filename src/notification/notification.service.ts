import { Injectable } from '@nestjs/common'
import { EmailService } from '../email/email.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { UpdateNotificationDto } from './dto/update-notification.dto'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { itineraryReminderTemplate } from './templates/itinerary-reminder-template'

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly schedulerRegistry: SchedulerRegistry
  ) {}

  create(createNotificationDto: CreateNotificationDto) {
    const date = new Date(createNotificationDto.date)
    const job = new CronJob(date, () => {
      this.emailService.sendEmail(
        createNotificationDto.recipient,
        `Reminder for ${createNotificationDto.tripName}`,
        itineraryReminderTemplate(
          createNotificationDto.recipientName,
          createNotificationDto.tripName,
          createNotificationDto.reminderOption
        )
      )
    })

    this.schedulerRegistry.addCronJob(
      `${Date.now()}-${createNotificationDto.recipient}`,
      job
    )
    job.start()
    return job
  }

  findAll() {
    return `This action returns all notification`
  }

  findOne(id: number) {
    return `This action returns a #${id} notification`
  }

  update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return `This action updates a #${id} notification`
  }

  remove(id: number) {
    return `This action removes a #${id} notification`
  }
}
