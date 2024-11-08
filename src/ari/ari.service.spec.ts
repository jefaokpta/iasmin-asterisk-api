import { Test, TestingModule } from '@nestjs/testing';
import { AriService } from './ari.service';

describe('AriService', () => {
  let service: AriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AriService],
    }).compile();

    service = module.get<AriService>(AriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});
