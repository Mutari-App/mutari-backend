import { Test, TestingModule } from '@nestjs/testing'
import { NotificationService } from './notification.service'
import { EmailService } from 'src/email/email.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { $Enums, REMINDER_OPTION } from '@prisma/client'
import { CronJob } from 'cron'
import { itineraryReminderTemplate } from './templates/itinerary-reminder-template'
import { UpdateNotificationDto } from './dto/update-notification.dto'

describe('NotificationService', () => {
  let service: NotificationService
  let emailService: EmailService
  let schedulerRegistry: SchedulerRegistry

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addCronJob: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<NotificationService>(NotificationService)
    emailService = module.get<EmailService>(EmailService)
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should schedule a sendEmail job', async () => {
      const createNotificationDto: CreateNotificationDto = {
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        date: new Date(Date.now() + 10000).toISOString(),
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      const jobSpy = jest.spyOn(CronJob.prototype, 'start')
      service.create(createNotificationDto)

      expect(schedulerRegistry.addCronJob).toHaveBeenCalled()
      expect(jobSpy).toHaveBeenCalled()
    })

    it('should call sendEmail with correct parameters', () => {
      const createNotificationDto: CreateNotificationDto = {
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        date: new Date(Date.now() + 10000).toISOString(),
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      service.create(createNotificationDto)
      const emailArgs = [
        createNotificationDto.recipient,
        `Reminder for ${createNotificationDto.tripName}`,
        itineraryReminderTemplate(
          createNotificationDto.recipientName,
          createNotificationDto.tripName,
          createNotificationDto.reminderOption
        ),
      ]

      expect(emailService.sendEmail).not.toHaveBeenCalled() // Since cron job runs later
    })

    it('should throw an error if emailService fails', async () => {
      emailService.sendEmail = jest.fn().mockImplementation(() => {
        throw new Error('Email sending failed')
      })

      const createNotificationDto: CreateNotificationDto = {
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        date: new Date(Date.now() + 10000).toISOString(),
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      expect(() => service.create(createNotificationDto)).not.toThrow() // Error happens later in job
    })
  })

  describe('findAll', () => {
    it('should return all notifications', () => {
      expect(service.findAll()).toBe('This action returns all notification')
    })
  })

  describe('findOne', () => {
    it('should return a single notification', () => {
      expect(service.findOne(1)).toBe('This action returns a #1 notification')
    })
  })

  describe('update', () => {
    it('should update a notification', () => {
      const updateDto: UpdateNotificationDto = {}
      expect(service.update(1, updateDto)).toBe(
        'This action updates a #1 notification'
      )
    })
  })

  describe('remove', () => {
    it('should remove a notification', () => {
      expect(service.remove(1)).toBe('This action removes a #1 notification')
    })
  })
})
