import { IsObject } from 'class-validator'

import { CreateItineraryDto } from './create-itinerary.dto'
import { CreateContingencyPlanDto } from './create-contingency-plan.dto'

export class DuplicateItineraryDto {
  @IsObject({ each: true })
  itinerary: CreateItineraryDto
  contingencyPlans: CreateContingencyPlanDto[]
}
