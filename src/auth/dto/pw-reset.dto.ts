import { IsString, MinLength, Matches, MaxLength } from 'class-validator'
import { VerifyPasswordResetDTO } from './verify-pw-reset.dto'
import { Match } from 'src/common/validators/match.validator'

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
  @Match('password', {
    message: 'Confirm password does not match new password',
  })
  confirmPassword: string
}
