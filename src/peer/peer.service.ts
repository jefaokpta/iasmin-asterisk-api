import { Injectable } from '@nestjs/common';
import { User } from './user';
import { PeerWriter } from './peer.writer';
import { AmiService } from '../ami/services/ami.service';

@Injectable()
export class PeerService {
  constructor(
    private readonly peerWriter: PeerWriter,
    private readonly amiService: AmiService,
  ) {}

  async writePeers(users: User[]) {
    await this.peerWriter.writePeers(users);
    this.amiService.pjsipReload();
  }
}
