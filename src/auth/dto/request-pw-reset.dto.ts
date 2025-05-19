import { IsEmail } from 'class-validator'

export class RequestPasswordResetDTO {
  @IsEmail()
  email: string
}
