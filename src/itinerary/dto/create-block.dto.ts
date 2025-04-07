import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator'
import { BLOCK_TYPE } from '@prisma/client'
import { CreateRouteDto } from './create-route.dto'

export class CreateBlockDto {
  @IsEnum(BLOCK_TYPE)
  @IsNotEmpty()
  blockType: 'LOCATION' | 'NOTE'

  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber()
  position: number

  @IsDateString()
  @IsOptional()
  startTime?: Date

  @IsDateString()
  @IsOptional()
  endTime?: Date

  @IsString()
  @IsOptional()
  location?: string

  @IsNumber()
  @IsOptional()
  price?: number

  @IsString()
  @IsOptional()
  photoUrl?: string

  @IsObject()
  @IsOptional()
  routeToNext?: CreateRouteDto

  @IsObject()
  @IsOptional()
  routeFromPrevious?: CreateRouteDto
}
