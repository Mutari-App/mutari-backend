import {
  Controller,
  Get,
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
      email: user.email,
      reminderOption: data.reminderOption,
      recipientName: user.firstName,
      tripName: data.tripName,
      startDate: data.startDate,
    })
    this.notificationService.scheduleEmail(data)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.CREATED,
        message: 'Itinerary Reminder created successfully',
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
      email: user.email,
      reminderOption: data.reminderOption,
      recipientName: user.firstName,
      tripName: data.tripName,
      startDate: data.startDate,
    })
    this.notificationService.cancelScheduledEmail(data)
    this.notificationService.scheduleEmail(data)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary Reminder updated successfully',
      },
      {
        data: reminder,
      }
    )
  }

  @Delete(':id')
  async removeAndCancel(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() data: EmailScheduleDto
  ) {
    data.recipient = user.email
    await this.notificationService.remove(id)
    this.notificationService.cancelScheduledEmail(data)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary Reminder deleted successfully',
      },
      null
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const reminder = await this.notificationService.findOne(id)
    return this.responseUtil.response(
      {
        statusCode: HttpStatus.OK,
        message: 'Itinerary Reminder fetched successfully',
      },
      {
        data: reminder,
      }
    )
  }
}
