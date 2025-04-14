import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator'

export class CreateUserDTO {
  @IsString()
  firstName: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsEmail()
  email: string

  @IsOptional()
  @IsDateString()
  birthDate?: string
}
