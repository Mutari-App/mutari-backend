import { IsString, MinLength, Matches, MaxLength } from 'class-validator'
import { VerifyPasswordResetDTO } from './verify-pw-reset.dto'

export class PasswordResetDTO extends VerifyPasswordResetDTO {
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

  @IsString()
  @MinLength(8)
  @MaxLength(8)
  verificationCode: string
}
