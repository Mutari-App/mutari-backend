import { Global, Module } from '@nestjs/common'
import { ResponseUtil } from './utils/response.util'

@Global()
@Module({
  providers: [ResponseUtil],
  exports: [ResponseUtil],
  imports: [],
})
export class CommonModule {}
