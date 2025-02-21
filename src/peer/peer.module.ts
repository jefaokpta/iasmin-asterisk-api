import { Module } from '@nestjs/common';
import { PeerService } from './peer.service';
import { PeerController } from './peer.controller';

@Module({
  controllers: [PeerController],
  providers: [PeerService],
})
export class PeerModule {}
