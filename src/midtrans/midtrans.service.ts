import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as midtransClient from 'midtrans-client'

@Injectable()
export class MidtransService {
  private readonly snap: midtransClient.Snap
  private readonly core: midtransClient.CoreApi

  constructor(private readonly configService: ConfigService) {
    // Initialize Snap API
    this.snap = new midtransClient.Snap({
      isProduction: this.configService.get('NODE_ENV') === 'production',
      serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
      clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
    })

    // Initialize Core API
    this.core = new midtransClient.CoreApi({
      isProduction: this.configService.get('NODE_ENV') === 'production',
      serverKey: this.configService.get('MIDTRANS_SERVER_KEY'),
      clientKey: this.configService.get('MIDTRANS_CLIENT_KEY'),
    })
  }

  /**
   * Create a transaction using Snap API
   * @param parameter Transaction parameters
   * @returns Snap response with token and redirect URL
   */
  async createTransaction(parameter: any) {
    return await this.snap.createTransaction(parameter)
  }

  /**
   * Create transaction token for frontend use
   * @param parameter Transaction parameters
   * @returns Transaction token
   */
  async createTransactionToken(parameter: any) {
    const transaction = await this.snap.createTransaction(parameter)
    return transaction.token
  }

  /**
   * Create transaction redirect URL
   * @param parameter Transaction parameters
   * @returns Redirect URL
   */
  async createTransactionRedirectUrl(parameter: any) {
    const transaction = await this.snap.createTransaction(parameter)
    return transaction.redirect_url
  }

  /**
   * Handle notification from Midtrans
   * @param notificationJson Notification JSON from Midtrans webhook
   * @returns Transaction status
   */
  async handleNotification(notificationJson: any) {
    return await this.core.transaction.notification(notificationJson)
  }

  /**
   * Get transaction status
   * @param transactionId Transaction ID
   * @returns Transaction status
   */
  async getTransactionStatus(transactionId: string) {
    return await this.core.transaction.status(transactionId)
  }
}
