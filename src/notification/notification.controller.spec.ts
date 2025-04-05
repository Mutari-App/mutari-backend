import { Test, TestingModule } from '@nestjs/testing'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { REMINDER_OPTION, User } from '@prisma/client'
import { EmailScheduleDto } from './dto/email-schedule.dto'
import { BadRequestException, HttpStatus } from '@nestjs/common'

describe('NotificationController', () => {
  let controller: NotificationController
  let service: NotificationService
  let responseUtil: ResponseUtil

  const mockUser: User = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    birthDate: new Date(),
    email: 'john@example.com',
    phoneNumber: '123456789',
    password: 'hashedpassword',
    photoProfile: null,
    referralCode: null,
    isEmailConfirmed: false,
    referredById: null,
    loyaltyPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockNotificationService = {
    create: jest.fn(),
    update: jest.fn(),
    scheduleEmail: jest.fn(),
    cancelScheduledEmail: jest.fn(),
  }

  const mockResponseUtil = {
    response: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: ResponseUtil,
          useValue: mockResponseUtil,
        },
      ],
    }).compile()

    controller = module.get<NotificationController>(NotificationController)
    service = module.get<NotificationService>(NotificationService)
    responseUtil = module.get<ResponseUtil>(ResponseUtil)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('createAndSchedule', () => {
    it('should create an itinerary reminder and schedule the cron job', async () => {
      const baseDate = Date.now()
      const data: EmailScheduleDto = {
        itineraryId: 'ITN-123',
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        startDate: new Date(baseDate + 1000 * 60 * 60).toISOString(),
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
      }

      const expectedItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itinerary Reminder created succefully',
        data: {
          data: expectedItineraryReminder,
        },
      }

      mockNotificationService.create.mockResolvedValue(
        expectedItineraryReminder
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.createAndSchedule(mockUser, data)

      expect(service.create).toHaveBeenCalledWith({
        itineraryId: data.itineraryId,
        email: data.recipient,
        reminderOption: data.reminderOption,
      })
      expect(service.scheduleEmail).toHaveBeenCalledWith(data)
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.CREATED,
          message: 'Itinerary Reminder created succefully',
        },
        {
          data: expectedItineraryReminder,
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateAndReschedule', () => {
    it('should update an itinerary reminder and reschdule the cron job', async () => {
      const baseDate = Date.now()
      const data: EmailScheduleDto = {
        itineraryId: 'ITN-123',
        recipient: 'test@example.com',
        recipientName: 'John Doe',
        tripName: 'Hawaii Trip',
        startDate: new Date(baseDate + 1000 * 60 * 60).toISOString(),
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
      }

      const expectedItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itinerary fetched successfully.',
        data: {
          data: expectedItineraryReminder,
        },
      }

      mockNotificationService.update.mockResolvedValue(
        expectedItineraryReminder
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.updateAndReschedule(
        'RMNDR-123',
        mockUser,
        data
      )

      expect(service.update).toHaveBeenCalledWith({
        itineraryId: data.itineraryId,
        email: data.recipient,
        reminderOption: data.reminderOption,
      })
      expect(service.cancelScheduledEmail).toHaveBeenCalledWith(data)
      expect(service.scheduleEmail).toHaveBeenCalledWith(data)
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itinerary Reminder updated succesfully',
        },
        {
          data: expectedItineraryReminder,
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })
})
