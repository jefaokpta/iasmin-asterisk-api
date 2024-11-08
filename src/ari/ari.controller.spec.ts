import { Test, TestingModule } from '@nestjs/testing';
import { AriController } from './ari.controller';
import { AriService } from './ari.service';

describe('AriController', () => {
  let controller: AriController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AriController],
      providers: [AriService],
    }).compile();

    controller = module.get<AriController>(AriController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
