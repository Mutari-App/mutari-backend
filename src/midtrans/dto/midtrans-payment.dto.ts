export class MidtransPaymentDTO {
  orderId: string
  amount: number
  customerDetails: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  itemDetails?: Array<{
    id: string
    price: number
    quantity: number
    name: string
  }>
  callbackUrl?: string
  redirectUrl?: string
}

export class MidtransNotificationDTO {
  transaction_time: string
  transaction_status: string
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  payment_type: string
  order_id: string
  merchant_id: string
  gross_amount: string
  fraud_status?: string
  currency: string
}
