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

  it('formatando data pra criar gravacao', () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    console.log(`_${date}_${time}`);
  });

});
