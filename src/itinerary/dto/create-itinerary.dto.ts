import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator'

import { CreateSectionDto } from './create-section.dto'

export class CreateItineraryDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsDateString()
  @IsNotEmpty()
  startDate: Date

  @IsDateString()
  @IsNotEmpty()
  endDate: Date

  @IsString({ each: true })
  @IsOptional()
  @IsArray()
  tags?: string[]

  @IsString()
  @IsOptional()
  coverImage?: string

  @IsObject({ each: true })
  @IsOptional()
  @IsArray()
  sections: CreateSectionDto[]
}
