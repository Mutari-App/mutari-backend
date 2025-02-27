import { IsNumber, IsOptional, IsPositive } from 'class-validator'

export class PaginationDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page: number
}
