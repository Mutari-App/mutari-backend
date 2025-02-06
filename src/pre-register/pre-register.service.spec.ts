import { Test, TestingModule } from '@nestjs/testing';
import { PreRegisterService } from './pre-register.service';

describe('PreRegisterService', () => {
  let service: PreRegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PreRegisterService],
    }).compile();

    service = module.get<PreRegisterService>(PreRegisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
