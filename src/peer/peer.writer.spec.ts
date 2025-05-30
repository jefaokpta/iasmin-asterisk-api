import { Test, TestingModule } from '@nestjs/testing';
import { PeerWriter } from './peer.writer';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { User } from './user';

describe('PeerWriter', () => {
  let service: PeerWriter;
  const tempPath = '/tmp';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeerWriter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(tempPath),
          },
        },
      ],
    }).compile();

    service = module.get<PeerWriter>(PeerWriter);
  });

  it('deve gerar arquivo pjsip-peers.conf corretamente', async () => {
    const users: User[] = [
      {
        id: 3,
        name: 'Teste User',
        controlNumber: 100023,
      },
      {
        id: 10,
        name: 'Teste User 10',
        controlNumber: 100023,
      },
    ];

    await service.writePeers(users);

    const content = await readFile(join(tempPath, 'pjsip-peers.conf'), 'utf-8');

    expect(content).toContain('callerid=Teste User <3>');
    expect(content).toContain('call_group=100023');
    expect(content).toContain('set_var=CDR(company)=100023');
  });
});