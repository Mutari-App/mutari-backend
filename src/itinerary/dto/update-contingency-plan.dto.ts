import { PartialType } from '@nestjs/mapped-types'
import { CreateContingencyPlanDto } from './create-contingency-plan.dto'

export class UpdateContingencyPlanDto extends PartialType(
  CreateContingencyPlanDto
) {}
