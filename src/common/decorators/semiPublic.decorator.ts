import { SetMetadata } from '@nestjs/common'

export const IS_SEMI_PUBLIC_KEY = 'isSemiPublic'
export const SemiPublic = () => SetMetadata(IS_SEMI_PUBLIC_KEY, true)
