import { Test, TestingModule } from '@nestjs/testing'
import { TicketService } from './ticket.service'
import { CreateTicketDto } from './dto/create-ticket.dto'
import { UpdateTicketDto } from './dto/update-ticket.dto'

describe('TicketService', () => {
  let service: TicketService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketService],
    }).compile()

    service = module.get<TicketService>(TicketService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should return a string indicating a new ticket was added', () => {
      const createTicketDto: CreateTicketDto = {}
      expect(service.create(createTicketDto)).toBe(
        'This action adds a new ticket'
      )
    })
  })

  describe('findAll', () => {
    it('should return a string indicating all tickets are returned', () => {
      expect(service.findAll()).toBe('This action returns all ticket')
    })
  })

  describe('findOne', () => {
    it('should return a string with the ticket id', () => {
      const id = 1
      expect(service.findOne(id)).toBe(`This action returns a #${id} ticket`)
    })
  })

  describe('update', () => {
    it('should return a string with the updated ticket id', () => {
      const id = 1
      const updateTicketDto: UpdateTicketDto = {}
      expect(service.update(id, updateTicketDto)).toBe(
        `This action updates a #${id} ticket`
      )
    })
  })

  describe('remove', () => {
    it('should return a string with the removed ticket id', () => {
      const id = 1
      expect(service.remove(id)).toBe(`This action removes a #${id} ticket`)
    })
  })
})
