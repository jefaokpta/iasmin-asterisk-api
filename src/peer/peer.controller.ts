import { Controller, Post, Body } from '@nestjs/common';
import { PeerService } from './peer.service';
import { User } from './model/user.model';

@Controller('peer')
export class PeerController {
  constructor(private readonly peerService: PeerService) {}

  @Post()
  writePeers(@Body() users: User[]) {
    return this.peerService.writePeers(users);
  }
  
}
