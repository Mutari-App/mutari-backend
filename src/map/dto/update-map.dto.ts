import { PartialType } from '@nestjs/mapped-types'
import { CreateMapDto } from './create-map.dto'

export class UpdateMapDto extends PartialType(CreateMapDto) {}
