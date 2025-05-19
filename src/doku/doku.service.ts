import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Injectable()
export class DokuService {
  private readonly baseUrl: string
  private readonly clientId: string
  private readonly secretKey: string

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? 'https://api.doku.com'
        : 'https://api-sandbox.doku.com'
    this.clientId = this.configService.get<string>('DOKU_CLIENT_ID')
    this.secretKey = this.configService.get<string>('DOKU_CLIENT_SECRET')
  }

  async getOrderStatus(invoiceNumber: string) {
    const requestId = this.generateRequestId()
    const requestTimestamp = new Date().toISOString()
    const requestTarget = `/orders/v1/status/${invoiceNumber}`

    const signature = this.generateSignature(
      requestId,
      requestTimestamp,
      requestTarget,
      this.clientId
    )

    const response = await fetch(`${this.baseUrl}${requestTarget}`, {
      method: 'GET',
      headers: {
        'Client-Id': this.clientId,
        'Request-Id': requestId,
        'Request-Timestamp': requestTimestamp,
        Signature: `HMACSHA256=${signature}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DOKU API error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  private generateRequestId(): string {
    return crypto.randomUUID()
  }

  private generateSignature(
    requestId: string,
    requestTimestamp: string,
    requestTarget: string,
    clientId: string
  ): string {
    const componentSignature =
      `Client-Id:${clientId}\n` +
      `Request-Id:${requestId}\n` +
      `Request-Timestamp:${requestTimestamp}\n` +
      `Request-Target:${requestTarget}`

    const hmac = crypto.createHmac('sha256', this.secretKey)
    hmac.update(componentSignature)
    return `${Buffer.from(hmac.digest()).toString('base64')}`
  }
}
