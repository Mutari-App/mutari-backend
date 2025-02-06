import { Test, TestingModule } from '@nestjs/testing';
import { PreRegisterController } from './pre-register.controller';
import { PreRegisterService } from './pre-register.service';

describe('PreRegisterController', () => {
  let controller: PreRegisterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreRegisterController],
      providers: [PreRegisterService],
    }).compile();

    controller = module.get<PreRegisterController>(PreRegisterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
