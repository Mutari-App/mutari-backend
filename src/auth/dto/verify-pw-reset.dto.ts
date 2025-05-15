import { IsString, MaxLength, MinLength } from 'class-validator'
import { RequestPasswordResetDTO } from './request-pw-reset.dto'

export class VerifyPasswordResetDTO extends RequestPasswordResetDTO {
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  verificationCode: string
}
