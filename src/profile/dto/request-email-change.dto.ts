import { IsEmail, IsString } from 'class-validator'

export class RequestChangeEmailDto {
  @IsString()
  @IsEmail()
  email: string
}
