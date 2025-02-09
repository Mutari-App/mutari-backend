import { Injectable, Logger } from '@nestjs/common'
import { HttpStatus } from '@nestjs/common/enums'
import { ResponseInterface } from './utils.interface'

@Injectable()
export class ResponseUtil {
  response(
    {
      statusCode = HttpStatus.OK,
      message = 'Data retrieved successfully!',
    }: ResponseInterface,
    data?: any
  ) {
    const responsePayload = {
      statusCode: statusCode,
      success: statusCode >= 200 && statusCode < 300,
      message: message,
      ...data,
    }

    Logger.log(responsePayload, `Response Body`)

    return responsePayload
  }
}
