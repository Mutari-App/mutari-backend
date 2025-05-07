import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator'

export class UpdateProfileDTO {
  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsDateString()
  birthDate?: string
}
