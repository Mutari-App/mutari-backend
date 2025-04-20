import { IsString } from 'class-validator'

export class CreateItineraryViewDto {
  @IsString()
  itineraryId: string
}
