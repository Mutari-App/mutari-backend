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
import { CreateItineraryReminderDto } from './dto/create-itinerary-reminder.dto'
import { UpdateItineraryReminderDto } from './dto/update-itinerary-reminder.dto'

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
  update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() data: EmailScheduleDto
  ) {
    const reminder = await this.notificationService.update({
      itineraryId: data.itineraryId,
      email: data.recipient,
      reminderOption: data.reminderOption,
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
  remove(@Param('id') id: string) {
    return this.notificationService.remove(+id)
  }
}
