import { Test, TestingModule } from '@nestjs/testing'
import { NotificationService } from './notification.service'
import { EmailService } from 'src/email/email.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { ItineraryReminder, REMINDER_OPTION } from '@prisma/client'
import { EmailScheduleDto } from './dto/email-schedule.dto'
import { CreateItineraryReminderDto } from './dto/create-itinerary-reminder.dto'
import { UpdateItineraryReminderDto } from './dto/update-itinerary-reminder.dto'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { CronJob } from 'cron'

describe('NotificationService', () => {
  let service: NotificationService
  let emailService: EmailService
  let schedulerRegistry: SchedulerRegistry

  const mockPrismaService = {
    $transaction: jest
      .fn()
      .mockImplementation((callback) => callback(mockPrismaService)),
    itineraryReminder: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    itinerary: {
      findUnique: jest.fn(),
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
            getCronJob: jest.fn(),
            deleteCronJob: jest.fn(),
            doesExist: jest.fn(),
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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should reschedule itinerary reminders on server restart', async () => {
      const baseDate = Date.now()
      const mockReminders = [
        {
          id: 'RMNDR-123',
          itineraryId: 'ITN-123',
          email: 'test@example.com',
          recipientName: 'Example',
          tripName: '',
          reminderOption: REMINDER_OPTION.ONE_HOUR_BEFORE,
          startDate: new Date(baseDate + 1000 * 60 * 60),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'RMNDR-124',
          itineraryId: 'ITN-124',
          email: 'test@example.com',
          recipientName: 'Example',
          tripName: '',
          reminderOption: REMINDER_OPTION.ONE_HOUR_BEFORE,
          startDate: new Date(baseDate + 1000 * 60 * 60),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrismaService.itineraryReminder.findMany.mockResolvedValue(
        mockReminders
      )
      await service.onModuleInit()
      expect(
        mockPrismaService.itineraryReminder.findMany
      ).toHaveBeenCalledWith()
    })
  })

  describe('create', () => {
    it('should create an itinerary reminder', async () => {
      const baseDate = Date.now()
      const createItineraryReminder: CreateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        recipientName: 'Example',
        tripName: 'Trip to Bahamas',
        startDate: new Date(baseDate + 1000 * 60 * 60).toDateString(),
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      const expectedItineraryReminder: ItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        recipientName: 'Example',
        tripName: 'Trip to Bahamas',
        startDate: new Date(baseDate + 1000 * 60 * 60),
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        'itinerary-exists'
      )
      mockPrismaService.itineraryReminder.findUnique.mockResolvedValue(null)
      mockPrismaService.itineraryReminder.create.mockResolvedValue(
        expectedItineraryReminder
      )

      // Logic
      const result = await service.create(createItineraryReminder)

      // Assert
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itineraryReminder.create).toHaveBeenCalledWith({
        data: {
          itineraryId: createItineraryReminder.itineraryId,
          recipientName: createItineraryReminder.recipientName,
          email: createItineraryReminder.email,
          tripName: createItineraryReminder.tripName,
          startDate: createItineraryReminder.startDate,
          reminderOption: createItineraryReminder.reminderOption,
        },
      })
      expect(result).toEqual(expectedItineraryReminder)
    })

    it('should throw NotFoundException if itinerary doesnt exist', async () => {
      const baseDate = Date.now()
      const createItineraryReminder: CreateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        recipientName: 'Example',
        tripName: 'Trip to Bahamas',
        startDate: new Date(baseDate + 1000 * 60 * 60).toDateString(),
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      // Assert
      await expect(service.create(createItineraryReminder)).rejects.toThrow(
        NotFoundException
      )
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw ConflictException if itinerary reminder already exist', async () => {
      const baseDate = Date.now()
      const createItineraryReminder: CreateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        recipientName: 'Example',
        tripName: 'Trip to Bahamas',
        startDate: new Date(baseDate + 1000 * 60 * 60).toDateString(),
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        'itinerary-exists'
      )
      mockPrismaService.itineraryReminder.findUnique.mockResolvedValue(
        'existing-reminder'
      )

      // Assert
      await expect(service.create(createItineraryReminder)).rejects.toThrow(
        ConflictException
      )
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('should return an array of itinerary reminders', async () => {
      const baseDate = Date.now()
      const mockReminders = [
        {
          id: 'RMNDR-123',
          itineraryId: 'ITN-123',
          email: 'test@example.com',
          recipientName: 'Example',
          tripName: '',
          reminderOption: REMINDER_OPTION.ONE_HOUR_BEFORE,
          startDate: new Date(baseDate + 1000 * 60 * 60),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'RMNDR-124',
          itineraryId: 'ITN-124',
          email: 'test@example.com',
          recipientName: 'Example',
          tripName: '',
          reminderOption: REMINDER_OPTION.ONE_HOUR_BEFORE,
          startDate: new Date(baseDate + 1000 * 60 * 60),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockPrismaService.itineraryReminder.findMany.mockResolvedValue(
        mockReminders
      )
      const result = await service.findAll()
      expect(
        mockPrismaService.itineraryReminder.findMany
      ).toHaveBeenCalledWith()
      expect(result).toEqual(mockReminders)
    })

    it('should return an empty array of itinerary reminders if none found', async () => {
      mockPrismaService.itineraryReminder.findMany.mockResolvedValue([])
      const result = await service.findAll()
      expect(
        mockPrismaService.itineraryReminder.findMany
      ).toHaveBeenCalledWith()
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('should return an itinerary reminder with associated itinerary id', async () => {
      const baseDate = Date.now()
      const mockReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        recipientName: 'Example',
        tripName: '',
        reminderOption: REMINDER_OPTION.ONE_HOUR_BEFORE,
        startDate: new Date(baseDate + 1000 * 60 * 60),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaService.itineraryReminder.findUnique.mockResolvedValue(
        mockReminder
      )
      const result = await service.findOne('ITN-123')
      expect(
        mockPrismaService.itineraryReminder.findUnique
      ).toHaveBeenCalledWith({
        where: { itineraryId: 'ITN-123' },
      })
      expect(result).toEqual(mockReminder)
    })

    it("should throw NotFoundException if associated itinerary's reminder does not exist", async () => {
      const itineraryId = 'non-existent-id'

      mockPrismaService.itineraryReminder.findUnique.mockResolvedValue(null)

      await expect(service.findOne(itineraryId)).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('update', () => {
    it('should update an itinerary reminder', async () => {
      const updateItineraryReminder: UpdateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      const existingItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        'itinerary-exists'
      )
      mockPrismaService.itineraryReminder.findUnique.mockResolvedValue(
        existingItineraryReminder
      )
      mockPrismaService.itineraryReminder.update.mockResolvedValue(
        updatedItineraryReminder
      )
      const result = await service.update(updateItineraryReminder)
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itineraryReminder.update).toHaveBeenCalledWith({
        where: { itineraryId: 'ITN-123' },
        data: {
          email: updateItineraryReminder.email,
          reminderOption: updateItineraryReminder.reminderOption,
        },
      })
      expect(result).toEqual(updatedItineraryReminder)
    })

    it('should throw NotFoundException if itinerary doesnt exist', async () => {
      const updateItineraryReminder: UpdateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      // Assert
      await expect(service.update(updateItineraryReminder)).rejects.toThrow(
        NotFoundException
      )
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if itinerary reminder does not exist', async () => {
      const updateItineraryReminder: UpdateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
      }

      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(
        'itinerary-exists'
      )
      mockPrismaService.itineraryReminder.findUnique.mockResolvedValue(null)

      // Assert
      await expect(service.update(updateItineraryReminder)).rejects.toThrow(
        NotFoundException
      )
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should remove an itinerary reminder', async () => {
      const itineraryId = 'ITN123'

      const existingItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: itineraryId,
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.ONE_DAY_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(itineraryId)
      mockPrismaService.itineraryReminder.findUnique.mockResolvedValue(
        existingItineraryReminder
      )
      mockPrismaService.itineraryReminder.delete.mockResolvedValue({
        id: itineraryId,
      })
      const result = await service.remove(itineraryId)
      expect(mockPrismaService.$transaction).toHaveBeenCalled()
      expect(mockPrismaService.itineraryReminder.delete).toHaveBeenCalledWith({
        where: { itineraryId: itineraryId },
      })
      expect(result).toEqual({ id: itineraryId })
    })

    it('should throw NotFoundException if itinerary doesnt exist', async () => {
      // Mocks
      mockPrismaService.itinerary.findUnique.mockResolvedValue(null)

      // Assert
      await expect(service.remove('non-existant')).rejects.toThrow(
        NotFoundException
      )
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('scheduleEmail', () => {
    it('should schedule a sendEmail job and verify it runs', async () => {
      // schedule job
      const baseDate = Date.now()
      const emailSchedule: EmailScheduleDto = {
        itineraryId: 'ITN-123',
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        startDate: new Date(baseDate + 1000 * 60 * 60).toISOString(),
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
      }

      const jobSpy = jest.spyOn(schedulerRegistry, 'addCronJob')
      const spy = jest.spyOn(service, 'scheduleEmail')
      service.scheduleEmail(emailSchedule)
      expect(jobSpy).toHaveBeenCalled()
      spy.mockClear()
    })

    it('should throw a ConflictException on already scheduled reminders', async () => {
      // schedule job
      const baseDate = Date.now()
      const emailSchedule: EmailScheduleDto = {
        itineraryId: 'ITN-123',
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        startDate: new Date(baseDate + 1000 * 60 * 60).toISOString(),
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
      }

      jest.spyOn(schedulerRegistry, 'doesExist').mockReturnValue(true)
      expect(() => {
        service.scheduleEmail(emailSchedule)
      }).toThrow(ConflictException)
    })

    it('should throw a BadRequestException on jobs with date in past', async () => {
      // schedule job
      const baseDate = Date.now()
      const emailSchedule: EmailScheduleDto = {
        itineraryId: 'ITN-123',
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        startDate: new Date(baseDate).toISOString(),
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
      }

      expect(() => {
        service.scheduleEmail(emailSchedule)
      }).toThrow(BadRequestException)
    })
  })

  describe('calculateScheduleDate', () => {
    it('should calculate scheduled date correctly', async () => {
      // schedule job
      const baseDate = Date.now()
      const startDate = new Date(baseDate + 1000 * 60 * 60 * 24).toISOString()

      // calculate scheduled date
      const expectedDate_ONEDAY = new Date(baseDate)
      const scheduledDate_ONEDAY = service._calculateScheduleDate(
        startDate,
        REMINDER_OPTION.ONE_DAY_BEFORE
      )
      expect(scheduledDate_ONEDAY).toEqual(expectedDate_ONEDAY)

      const expectedDate_ONEHOUR = new Date(baseDate + 1000 * 60 * 60 * 23)
      const scheduledDate_ONEHOUR = service._calculateScheduleDate(
        startDate,
        REMINDER_OPTION.ONE_HOUR_BEFORE
      )
      expect(scheduledDate_ONEHOUR).toEqual(expectedDate_ONEHOUR)

      const expectedDate_TENMINUTES = new Date(
        baseDate + 1000 * 60 * 60 * 23 + 1000 * 60 * 50
      )
      const scheduledDate_TENMINUTES = service._calculateScheduleDate(
        startDate,
        REMINDER_OPTION.TEN_MINUTES_BEFORE
      )
      expect(scheduledDate_TENMINUTES).toEqual(expectedDate_TENMINUTES)
    })

    it('should throw BadRequestException on improper reminder option', async () => {
      // schedule job
      const baseDate = Date.now()
      const startDate = new Date(baseDate + 1000 * 60 * 60).toISOString()

      // calculate scheduled date
      expect(() => {
        service._calculateScheduleDate(startDate, REMINDER_OPTION.NONE)
      }).toThrow(BadRequestException)
    })
  })

  describe('cancelScheduledEmail', () => {
    it('should cancel an existing scheduled email job', async () => {
      // schedule job
      const baseDate = Date.now()
      const emailSchedule: EmailScheduleDto = {
        itineraryId: 'ITN-123',
        recipient: 'test@example.com',
        startDate: new Date(baseDate + 1000 * 60 * 60).toISOString(),
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
      }
      const jobName = `${emailSchedule.itineraryId}-${emailSchedule.recipient}`

      jest.spyOn(schedulerRegistry, 'doesExist').mockReturnValue(true)
      jest.spyOn(schedulerRegistry, 'deleteCronJob')
      service.cancelScheduledEmail(emailSchedule)
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith(jobName)
    })

    it('should throw a NotFoundException if job doesnt exist', async () => {
      // schedule job
      const baseDate = Date.now()
      const emailSchedule: EmailScheduleDto = {
        itineraryId: 'ITN-123',
        recipient: 'test@example.com',
        startDate: new Date(baseDate + 1000 * 60 * 60).toISOString(),
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
      }

      jest.spyOn(schedulerRegistry, 'doesExist').mockReturnValue(false)
      expect(() => {
        service.cancelScheduledEmail(emailSchedule)
      }).toThrow(NotFoundException)
    })
  })

  describe('_formatReminderOption', () => {
    it('should return "1 hari" for ONE_DAY_BEFORE option', () => {
      const result = service._formatReminderOption(
        REMINDER_OPTION.ONE_DAY_BEFORE
      )
      expect(result).toEqual('1 hari')
    })

    it('should return "1 jam" for ONE_HOUR_BEFORE option', () => {
      const result = service._formatReminderOption(
        REMINDER_OPTION.ONE_HOUR_BEFORE
      )
      expect(result).toEqual('1 jam')
    })

    it('should return "10 menit" for TEN_MINUTES_BEFORE option', () => {
      const result = service._formatReminderOption(
        REMINDER_OPTION.TEN_MINUTES_BEFORE
      )
      expect(result).toEqual('10 menit')
    })

    it('should return "tidak diketahui" for unknown option', () => {
      const result = service._formatReminderOption(
        'UNKNOWN_OPTION' as REMINDER_OPTION
      )
      expect(result).toEqual('tidak diketahui')
    })
  })
})
