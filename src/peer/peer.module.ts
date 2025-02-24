import { Module } from '@nestjs/common';
import { PeerService } from './peer.service';
import { PeerController } from './peer.controller';
import { PeerWriter } from './peer.writer';
import { AmiModule } from '../ami/ami.module';
@Module({
  imports: [AmiModule],
  controllers: [PeerController],
  providers: [
    PeerService,
    PeerWriter
  ],
})
export class PeerModule {}
