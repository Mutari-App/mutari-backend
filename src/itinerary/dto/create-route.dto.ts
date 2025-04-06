import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'
import { TRANSPORT_MODE } from '@prisma/client'

export class CreateRouteDto {
  @IsString()
  sourceBlockId: string

  @IsString()
  destinationBlockId: string

  @IsNumber()
  distance: number // Distance in meters

  @IsNumber()
  duration: number // Duration in seconds

  @IsString()
  @IsOptional()
  polyline?: string

  @IsEnum(TRANSPORT_MODE)
  @IsOptional()
  transportMode?: TRANSPORT_MODE
}
