import { Controller, Post, Body } from '@nestjs/common';
import { PeerService } from './peer.service';
import { UserDto } from './dto/user.dto';

@Controller('peers')
export class PeerController {
  constructor(private readonly peerService: PeerService) {}

  @Post()
  writePeers(@Body() users: UserDto[]) {
    this.peerService.writePeers(users);
  }
  
}
