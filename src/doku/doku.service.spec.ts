import { Test, TestingModule } from '@nestjs/testing'
import { DokuService } from './doku.service'
import { ConfigService } from '@nestjs/config'

describe('DokuService', () => {
  let service: DokuService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DokuService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              return 'mock value'
            }),
          },
        },
      ],
    }).compile()

    service = module.get<DokuService>(DokuService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
