import { TITLE } from '@prisma/client'
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from 'class-validator'

class TourParticipantDTO {
  @IsNotEmpty()
  @IsEnum(TITLE)
  title: TITLE

  @IsNotEmpty()
  @IsString()
  firstName: string

  @IsNotEmpty()
  @IsString()
  lastName: string

  @IsNotEmpty()
  @IsPhoneNumber('ID')
  phoneNumber: string

  @IsNotEmpty()
  @IsEmail()
  email: string
}

export class BuyTourTicketDTO {
  @IsNotEmpty()
  @IsDateString()
  tourDate: Date

  @IsNumber()
  quantity: number

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TourParticipantDTO)
  customer: TourParticipantDTO

  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one customer is required' })
  @Type(() => TourParticipantDTO)
  visitors: TourParticipantDTO[]
}
