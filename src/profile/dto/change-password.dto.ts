import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator'
import { Match } from 'src/common/validators/match.validator'

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[A-Z]).*$/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d).*$/, {
    message: 'Password must contain at least one number',
  })
  newPassword: string

  @IsString()
  @Match('newPassword', {
    message: 'Confirm password does not match new password',
  })
  confirmPassword: string
}
