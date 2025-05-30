import { Body, Controller, Post } from '@nestjs/common';
import { PeerService } from './peer.service';
import { User } from './user';

@Controller('peers')
export class PeerController {
  constructor(private readonly peerService: PeerService) {}

  @Post()
  writePeers(@Body() users: User[]) {
    this.peerService.writePeers(users);
  }
}
