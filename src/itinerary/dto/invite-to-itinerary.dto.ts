import { IsArray, IsEmail, ArrayNotEmpty, ArrayMinSize } from 'class-validator'

export class InviteToItineraryDTO {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[]
}
