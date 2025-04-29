import { Test, TestingModule } from '@nestjs/testing'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { UpdatePaymentDto } from './dto/update-payment.dto'

describe('PaymentController', () => {
  let controller: PaymentController
  let service: PaymentService

  beforeEach(async () => {
    const mockPaymentService = {
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      findAll: jest.fn(() => [{ id: 1 }, { id: 2 }]),
      findOne: jest.fn((id) => ({ id })),
      update: jest.fn((id, dto) => ({ id, ...dto })),
      remove: jest.fn((id) => ({ id })),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile()

    controller = module.get<PaymentController>(PaymentController)
    service = module.get<PaymentService>(PaymentService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a payment', () => {
      const dto: CreatePaymentDto = {
        amount: 100,
        description: 'Test payment',
      } as CreatePaymentDto
      expect(controller.create(dto)).toEqual({ id: 1, ...dto })
      expect(service.create).toHaveBeenCalledWith(dto)
    })
  })

  describe('findAll', () => {
    it('should return an array of payments', () => {
      expect(controller.findAll()).toEqual([{ id: 1 }, { id: 2 }])
      expect(service.findAll).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('should return a single payment', () => {
      const id = '1'
      expect(controller.findOne(id)).toEqual({ id: 1 })
      expect(service.findOne).toHaveBeenCalledWith(1)
    })
  })

  describe('update', () => {
    it('should update a payment', () => {
      const id = '1'
      const dto: UpdatePaymentDto = { amount: 200 } as UpdatePaymentDto
      expect(controller.update(id, dto)).toEqual({ id: 1, ...dto })
      expect(service.update).toHaveBeenCalledWith(1, dto)
    })
  })

  describe('remove', () => {
    it('should remove a payment', () => {
      const id = '1'
      expect(controller.remove(id)).toEqual({ id: 1 })
      expect(service.remove).toHaveBeenCalledWith(1)
    })
  })
})
