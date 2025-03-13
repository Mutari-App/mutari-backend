import { SetMetadata } from '@nestjs/common'

export const PreRegistOnly = () => SetMetadata('preRegistOnly', true)
