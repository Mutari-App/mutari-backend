import {
  IsEmail,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
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
  @IsPhoneNumber('ID')
  phoneNumber?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  referralCode: string
}
