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
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

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
      findUnique: jest.fn(),
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
        email: 'test@example.com',
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
          email: createItineraryReminder.email,
          reminderOption: createItineraryReminder.reminderOption,
        },
      })
      expect(result).toEqual(expectedItineraryReminder)
    })

    it('should throw NotFoundException if itinerary doesnt exist', async () => {
      const createItineraryReminder: CreateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
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
      const createItineraryReminder: CreateItineraryReminderDto = {
        itineraryId: 'ITN-123',
        email: 'test@example.com',
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
    it('should remove a notification', () => {
      expect(service.remove(1)).toBe('This action removes a #1 notification')
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
      service.scheduleEmail(emailSchedule)
      expect(jobSpy).toHaveBeenCalled()
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
})
