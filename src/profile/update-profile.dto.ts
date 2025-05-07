import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'

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

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Z]).*$/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d).*$/, {
    message: 'Password must contain at least one number',
  })
  password?: string

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=[^A-Z]*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d).*$/, {
    message: 'Password must contain at least one number',
  })
  confirmPassword?: string
}
