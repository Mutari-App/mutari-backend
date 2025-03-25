import { REMINDER_OPTION } from '@prisma/client'
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CreateItineraryReminderDto {
  @IsString()
  @IsUUID()
  itineraryId: string

  @IsEmail()
  email: string

  @IsEnum(REMINDER_OPTION)
  @IsNotEmpty()
  reminderOption: 'TEN_MINUTES_BEFORE' | 'ONE_HOUR_BEFORE' | 'ONE_DAY_BEFORE'
}
