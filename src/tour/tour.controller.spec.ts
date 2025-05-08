import { Test, TestingModule } from '@nestjs/testing'
import { TourController } from './tour.controller'
import { TourService } from './tour.service'
import { CreateTourDto } from './dto/create-tour.dto'
import { UpdateTourDto } from './dto/update-tour.dto'

describe('TourController', () => {
  let controller: TourController
  let service: TourService

  beforeEach(async () => {
    const mockTourService = {
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      findAll: jest.fn(() => [{ id: 1, title: 'Test tour' }]),
      findOne: jest.fn((id) => ({ id, title: 'Test tour' })),
      update: jest.fn((id, dto) => ({ id, ...dto })),
      remove: jest.fn((id) => ({ id, deleted: true })),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourController],
      providers: [
        {
          provide: TourService,
          useValue: mockTourService,
        },
      ],
    }).compile()

    controller = module.get<TourController>(TourController)
    service = module.get<TourService>(TourService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a tour', () => {
      const createTourDto: CreateTourDto = {
        title: 'New Tour',
        description: 'Test Description',
      }
      expect(controller.create(createTourDto)).toEqual({
        id: 1,
        ...createTourDto,
      })
      expect(service.create).toHaveBeenCalledWith(createTourDto)
    })
  })

  describe('findAll', () => {
    it('should return array of tours', () => {
      expect(controller.findAll()).toEqual([{ id: 1, title: 'Test tour' }])
      expect(service.findAll).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('should return a single tour', () => {
      const id = '1'
      expect(controller.findOne(id)).toEqual({ id: '1', title: 'Test tour' })
      expect(service.findOne).toHaveBeenCalledWith('1')
    })
  })

  describe('update', () => {
    it('should update a tour', () => {
      const id = '1'
      const updateTourDto: UpdateTourDto = { title: 'Updated Tour' }
      expect(controller.update(id, updateTourDto)).toEqual({
        id: '1',
        ...updateTourDto,
      })
      expect(service.update).toHaveBeenCalledWith('1', updateTourDto)
    })
  })

  describe('remove', () => {
    it('should remove a tour', () => {
      const id = '1'
      expect(controller.remove(id)).toEqual({ id: '1', deleted: true })
      expect(service.remove).toHaveBeenCalledWith('1')
    })
  })
})
