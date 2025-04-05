import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common'
import { NotificationService } from './notification.service'
import { User } from '@prisma/client'
import { GetUser } from 'src/common/decorators/getUser.decorator'
import { ResponseUtil } from 'src/common/utils/response.util'
import { EmailScheduleDto } from './dto/email-schedule.dto'

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly responseUtil: ResponseUtil
  ) {}

  @Post()
  async createAndSchedule(
    @GetUser() user: User,
    @Body() data: EmailScheduleDto
  ) {
    const reminder = await this.notificationService.create({
      itineraryId: data.itineraryId,
      email: data.recipient,
      reminderOption: data.reminderOption,
      recipientName: data.recipientName,
      tripName: data.tripName,
      startDate: data.startDate,
    })
    this.notificationService.scheduleEmail(data)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary Reminder created succefully',
      },
      {
        data: reminder,
      }
    )
  }

  @Patch(':id')
  async updateAndReschedule(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() data: EmailScheduleDto
  ) {
    const reminder = await this.notificationService.update({
      itineraryId: id,
      email: data.recipient,
      reminderOption: data.reminderOption,
      recipientName: data.recipientName,
      tripName: data.tripName,
      startDate: data.startDate,
    })
    this.notificationService.cancelScheduledEmail(data)
    this.notificationService.scheduleEmail(data)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary Reminder updated succesfully',
      },
      {
        data: reminder,
      }
    )
  }

  @Delete(':id')
  async removeAndCancel(
    @Param('id') id: string,
    @Body() data: EmailScheduleDto
  ) {
    await this.notificationService.remove(id)
    this.notificationService.cancelScheduledEmail(data)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary Reminder deleted succesfully',
      },
      null
    )
  }
}
