import { Test, TestingModule } from '@nestjs/testing'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { ResponseUtil } from 'src/common/utils/response.util'
import { REMINDER_OPTION, User } from '@prisma/client'
import { EmailScheduleDto } from './dto/email-schedule.dto'
import { HttpStatus } from '@nestjs/common'

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
    remove: jest.fn(),
    findOne: jest.fn(),
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
        recipientName: data.recipientName,
        tripName: data.tripName,
        startDate: data.startDate,
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
        recipientName: data.recipientName,
        tripName: data.tripName,
        startDate: data.startDate,
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
        recipientName: data.recipientName,
        tripName: data.tripName,
        startDate: data.startDate,
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
        'ITN-123',
        mockUser,
        data
      )

      expect(service.update).toHaveBeenCalledWith({
        itineraryId: data.itineraryId,
        email: data.recipient,
        reminderOption: data.reminderOption,
        recipientName: data.recipientName,
        tripName: data.tripName,
        startDate: data.startDate,
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

  describe('removeAndCancel', () => {
    it('should remove an itinerary reminder and cancel the cron job', async () => {
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
        message: 'Itinerary Reminder deleted successfully.',
        data: {
          data: null,
        },
      }

      mockNotificationService.remove.mockResolvedValue(
        expectedItineraryReminder
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.removeAndCancel('ITN-123', data)

      expect(service.remove).toHaveBeenCalledWith(data.itineraryId)
      expect(service.cancelScheduledEmail).toHaveBeenCalledWith(data)
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itinerary Reminder deleted succesfully',
        },
        null
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('findOne', () => {
    it('should fetch an itinerary reminder and return OK when found', async () => {
      const baseDate = Date.now()
      const expectedItineraryReminder: ItineraryReminder = {
        id: 'RMNDR-123',
        itineraryId: 'ITN-123',
        email: 'test@example.com',
        recipientName: mockUser.firstName,
        reminderOption: REMINDER_OPTION.TEN_MINUTES_BEFORE,
        createdAt: new Date(),
        updatedAt: new Date(),
        tripName: 'Trip to Bahamas',
        startDate: new Date(baseDate + 1000 * 60 * 60),
      }

      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Itinerary Reminder fetched successfully',
        data: {
          data: expectedItineraryReminder,
        },
      }

      mockNotificationService.findOne.mockResolvedValue(
        expectedItineraryReminder
      )
      mockResponseUtil.response.mockReturnValue(mockResponse)

      const result = await controller.findOne('ITN-123')

      expect(service.findOne).toHaveBeenCalledWith('ITN-123')
      expect(responseUtil.response).toHaveBeenCalledWith(
        {
          statusCode: HttpStatus.OK,
          message: 'Itinerary Reminder fetched successfully',
        },
        {
          data: expectedItineraryReminder,
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should pass errors from service to the caller', async () => {
      const mockError = new Error('Itinerary with ID non-existent-id not found')
      mockNotificationService.findOne.mockRejectedValue(mockError)

      // Act & Assert
      await expect(controller.findOne('non-existent-id')).rejects.toThrow(
        mockError
      )

      expect(mockNotificationService.findOne).toHaveBeenCalledWith(
        'non-existent-id'
      )
      expect(mockResponseUtil.response).not.toHaveBeenCalled()
    })
  })
})
