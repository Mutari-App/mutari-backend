import { IsString, MaxLength, MinLength } from 'class-validator'

export class EmailChangeVerificationDto {
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  code: string
}
