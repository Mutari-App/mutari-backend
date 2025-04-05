import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  IsUUID,
} from 'class-validator'

import { CreateSectionDto } from './create-section.dto'

export class CreateContingencyPlanDto {
  @IsUUID()
  @IsNotEmpty()
  itineraryId: string

  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsOptional()
  isSelected?: boolean

  @IsObject({ each: true })
  @IsOptional()
  @IsArray()
  sections: CreateSectionDto[]
}
