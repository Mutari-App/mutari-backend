import { Type } from 'class-transformer'
import { IsNumber, IsOptional, IsPositive } from 'class-validator'

export class PaginationDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page: string
}
