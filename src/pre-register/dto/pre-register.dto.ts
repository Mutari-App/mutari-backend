import { IsEmail, IsOptional, IsString } from 'class-validator'

export class PreRegisterDTO {
  @IsString()
  firstName: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  phoneNumber?: string

  @IsString()
  city: string

  @IsString()
  country: string
}
