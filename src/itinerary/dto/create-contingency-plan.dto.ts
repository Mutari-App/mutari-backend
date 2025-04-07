import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator'
import { CreateSectionDto } from './create-section.dto'

export class CreateContingencyPlanDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsOptional()
  description?: string

  @IsObject({ each: true })
  @IsNotEmpty()
  @IsArray()
  sections: CreateSectionDto[]
}
