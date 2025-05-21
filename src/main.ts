import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import { urlencoded, json } from 'express'

import './instrument'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Cors Option
  const whitelistUrls: any[] = (
    process.env.APP_WHITELIST || 'http://localhost:3000'
  ).split(',')
  const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || whitelistUrls.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  }
  app.enableCors(corsOptions)
  app.use(cookieParser())
  app.use(json({ limit: '1mb' }))
  app.use(urlencoded({ extended: true, limit: '1mb' }))

  app.useGlobalPipes(new ValidationPipe())

  await app.listen(process.env.PORT || process.env.APP_PORT || 3001)
}
bootstrap()
