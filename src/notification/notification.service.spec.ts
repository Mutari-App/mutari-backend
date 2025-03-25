import { Test, TestingModule } from '@nestjs/testing'
import { NotificationService } from './notification.service'
import { EmailService } from 'src/email/email.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { $Enums, REMINDER_OPTION } from '@prisma/client'
import { CronJob } from 'cron'
import { EmailScheduleDto } from './dto/email-schedule.dto'
import { CreateItineraryReminderDto } from './dto/create-itinerary-reminder.dto'
import { UpdateItineraryReminderDto } from './dto/update-itinerary-reminder.dto'
import { itineraryReminderTemplate } from './templates/itinerary-reminder-template'

describe('NotificationService', () => {
  let service: NotificationService
  let emailService: EmailService
  let schedulerRegistry: SchedulerRegistry
  let prismaService: PrismaService

  const mockPrismaService = {
    $transaction: jest
      .fn()
      .mockImplementation((callback) => callback(mockPrismaService)),
    itineraryReminder: {
      create: jest.fn(),
    },
  }

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
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<NotificationService>(NotificationService)
    emailService = module.get<EmailService>(EmailService)
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create an itinerary reminder', async () => {
      const createItineraryReminder: CreateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      const expectedItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: '',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // save to db
      mockPrismaService.itineraryReminder.create.mockResolvedValue(
        expectedItineraryReminder
      )
      const result = await service.create(createItineraryReminder)
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itineraryReminder.create).toHaveBeenCalledWith({
        data: {
          itineraryId: createItineraryReminder.itineraryId,
          email: createItineraryReminder.email,
          reminderOption: createItineraryReminder.reminderOption,
        },
      })
      expect(result).toEqual(expectedItineraryReminder)
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
      const data: UpdateItineraryReminderDto = {}
      expect(service.update(1, data)).toBe(
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
