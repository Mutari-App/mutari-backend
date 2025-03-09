import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator'
import { CreateBlockDto } from './create-block.dto'

export class CreateSectionDto {
  @IsNumber()
  sectionNumber: number

  @IsString()
  @IsOptional()
  title?: string

  @IsObject({ each: true })
  @IsOptional()
  @IsArray()
  blocks: CreateBlockDto[]
}
