import { Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { PeerWriter } from './peer.writer';
@Injectable()
export class PeerService {

  constructor(private readonly peerWriter: PeerWriter) {}

  writePeers(users: UserDto[]) {
    this.peerWriter.writePeers(users);
  }
  
}
