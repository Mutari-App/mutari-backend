import { Test, TestingModule } from '@nestjs/testing'
import { EmailService } from './email.service'
import * as nodemailer from 'nodemailer'

// Mock nodemailer
jest.mock('nodemailer')

describe('EmailService', () => {
  let service: EmailService
  let sendMailMock: jest.Mock

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: '12345' })
    ;(nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile()

    service = module.get<EmailService>(EmailService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should send an email successfully', async () => {
    const result = await service.sendEmail(
      'test@example.com',
      'Test Subject',
      '<p>Test Email Content</p>'
    )

    expect(sendMailMock).toHaveBeenCalledWith({
      from: process.env.EMAIL_FROM,
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test Email Content</p>',
    })

    expect(result).toEqual({ message: 'Email sent successfully' })
  })

  it('should handle errors if sending email fails', async () => {
    sendMailMock.mockRejectedValue(new Error('Failed to send email'))

    await expect(
      service.sendEmail('test@example.com', 'Test Subject', '<p>Test Email</p>')
    ).rejects.toThrow('Failed to send email')
  })
})
