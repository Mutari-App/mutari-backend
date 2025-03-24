import { REMINDER_OPTION } from '@prisma/client'
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator'

export class CreateNotificationDto {
  @IsEmail()
  recipient: string

  @IsString()
  recipientName: string

  @IsString()
  tripName: string

  @IsEnum(REMINDER_OPTION)
  @IsNotEmpty()
  reminderOption: 'TEN_MINUTES_BEFORE' | 'ONE_HOUR_BEFORE' | 'ONE_DAY_BEFORE'

  @IsDateString()
  date: string
}
