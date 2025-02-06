import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { Prisma } from '@prisma/client'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp()

    const response = context.getResponse<Response>()
    const request = context.getRequest<Request>()

    const isPrismaError =
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientValidationError

    const handlePrismaQueryError =
      process.env.NODE_ENV === 'production' && isPrismaError

    const code = handlePrismaQueryError
      ? HttpStatus.BAD_REQUEST
      : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message = handlePrismaQueryError
      ? 'Invalid query'
      : exception.response?.statusCode === 400
        ? exception.response?.message
        : exception.message

    const exceptionMessage =
      exception.response?.statusCode === 400
        ? `
      Validation Error: ${exception.response?.message}

      Stack Trace: ${exception.stack}
      `
        : exception.stack

    Logger.error(exceptionMessage, `Exception ${request.method} ${request.url}`)

    const responseData = {
      success: false,
      code,
      message,
    }

    return response.status(code).json(responseData)
  }
}
