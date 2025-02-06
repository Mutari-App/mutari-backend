import { HttpStatus } from '@nestjs/common'

export interface ResponseInterface {
  code?: HttpStatus
  message?: string
}
