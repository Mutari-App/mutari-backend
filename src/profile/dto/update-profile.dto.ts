import { IsDateString, IsOptional, IsString } from 'class-validator'

export class UpdateProfileDTO {
  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsDateString()
  birthDate?: string
}
