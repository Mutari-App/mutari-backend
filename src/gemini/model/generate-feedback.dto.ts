import { IsNotEmpty, IsString } from 'class-validator'

export class GenerateFeedbackDto {
  // @IsNotEmpty()
  // @IsObject()
  // itinerary: object;

  @IsString()
  @IsNotEmpty()
  prompt: string
}
