import { IsString, MaxLength, MinLength } from 'class-validator'
import { CreateUserDTO } from './create-user.dto'

export class VerifyRegistrationDTO extends CreateUserDTO {
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  verificationCode: string
}
