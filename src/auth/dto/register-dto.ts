import { VerifyRegistrationDTO } from './verify-registration-dto'
import { IsString, MinLength, Matches } from 'class-validator'

export class RegisterDTO extends VerifyRegistrationDTO {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Z]).*$/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d).*$/, {
    message: 'Password must contain at least one number',
  })
  password: string

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=[^A-Z]*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d).*$/, {
    message: 'Password must contain at least one number',
  })
  confirmPassword: string
}
