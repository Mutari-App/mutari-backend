import { Test, TestingModule } from '@nestjs/testing'
import { PaymentService } from './payment.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'

describe('PaymentService', () => {
  let service: PaymentService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService],
    }).compile()

    service = module.get<PaymentService>(PaymentService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should return a string indicating a new payment was added', () => {
      const createPaymentDto: CreatePaymentDto = {} as CreatePaymentDto
      expect(service.create(createPaymentDto)).toBe(
        'This action adds a new payment'
      )
    })
  })

  describe('findAll', () => {
    it('should return a string indicating all payments were returned', () => {
      expect(service.findAll()).toBe('This action returns all payment')
    })
  })

  describe('findOne', () => {
    it('should return a string indicating a specific payment was returned', () => {
      const id = 1
      expect(service.findOne(id)).toBe(`This action returns a #${id} payment`)
    })
  })

  describe('update', () => {
    it('should return a string indicating a payment was updated', () => {
      const id = 1
      const updatePaymentDto: UpdatePaymentDto = {} as UpdatePaymentDto
      expect(service.update(id, updatePaymentDto)).toBe(
        `This action updates a #${id} payment`
      )
    })
  })

  describe('remove', () => {
    it('should return a string indicating a payment was removed', () => {
      const id = 1
      expect(service.remove(id)).toBe(`This action removes a #${id} payment`)
    })
  })
})
