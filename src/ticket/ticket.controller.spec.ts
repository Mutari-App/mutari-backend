import { Test, TestingModule } from '@nestjs/testing'
import { TicketController } from './ticket.controller'
import { TicketService } from './ticket.service'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'

describe('TicketController', () => {
  let controller: TicketController
  let service: TicketService

  beforeEach(async () => {
    const mockTicketService = {
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      findAll: jest.fn(() => [{ id: 1, title: 'Test ticket' }]),
      findOne: jest.fn((id) => ({ id, title: 'Test ticket' })),
      update: jest.fn((id, dto) => ({ id, ...dto })),
      remove: jest.fn((id) => ({ id, deleted: true })),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: mockTicketService,
        },
      ],
    }).compile()

    controller = module.get<TicketController>(TicketController)
    service = module.get<TicketService>(TicketService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a ticket', () => {
      const createTicketDto: CreateTicketDto = {
        title: 'New Ticket',
        description: 'Test Description',
      }
      expect(controller.create(createTicketDto)).toEqual({
        id: 1,
        ...createTicketDto,
      })
      expect(service.create).toHaveBeenCalledWith(createTicketDto)
    })
  })

  describe('findAll', () => {
    it('should return array of tickets', () => {
      expect(controller.findAll()).toEqual([{ id: 1, title: 'Test ticket' }])
      expect(service.findAll).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('should return a single ticket', () => {
      const id = '1'
      expect(controller.findOne(id)).toEqual({ id: 1, title: 'Test ticket' })
      expect(service.findOne).toHaveBeenCalledWith(1)
    })
  })

  describe('update', () => {
    it('should update a ticket', () => {
      const id = '1'
      const updateTicketDto: UpdateTicketDto = { title: 'Updated Ticket' }
      expect(controller.update(id, updateTicketDto)).toEqual({
        id: 1,
        ...updateTicketDto,
      })
      expect(service.update).toHaveBeenCalledWith(1, updateTicketDto)
    })
  })

  describe('remove', () => {
    it('should remove a ticket', () => {
      const id = '1'
      expect(controller.remove(id)).toEqual({ id: 1, deleted: true })
      expect(service.remove).toHaveBeenCalledWith(1)
    })
  })
})
