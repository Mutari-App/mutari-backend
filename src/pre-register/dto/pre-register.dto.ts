import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

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

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  referralCode: string
}
