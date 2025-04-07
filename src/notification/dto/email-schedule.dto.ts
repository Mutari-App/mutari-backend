import { REMINDER_OPTION } from '@prisma/client'
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator'

export class EmailScheduleDto {
  @IsString()
  @IsUUID()
  itineraryId: string

  @IsEmail()
  recipient: string

  @IsString()
  recipientName?: string

  @IsString()
  tripName?: string

  @IsEnum(REMINDER_OPTION)
  @IsNotEmpty()
  reminderOption: 'TEN_MINUTES_BEFORE' | 'ONE_HOUR_BEFORE' | 'ONE_DAY_BEFORE'

  @IsDateString()
  startDate: string
}
