import { PartialType } from '@nestjs/mapped-types'
import { CreateItineraryReminderDto } from './create-itinerary-reminder.dto'

export class UpdateItineraryReminderDto extends PartialType(
  CreateItineraryReminderDto
) {}
