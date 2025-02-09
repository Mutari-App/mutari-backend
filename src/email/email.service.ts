import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'Zoho',
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true, // false untuk TLS (587), true untuk SSL (465)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  async sendEmail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    return { message: 'Email sent successfully' }
  }
}
