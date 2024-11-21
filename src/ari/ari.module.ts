import { Module } from '@nestjs/common';
import { AriService } from './ari.service';
import { AriController } from './ari.controller';
import { RouterCallAppService } from './apps/router-call-app.service';
import { SimpleCallService } from './apps/util/simple-call.service';

@Module({
  controllers: [AriController],
  providers: [
    AriService,
    RouterCallAppService,
    SimpleCallService
  ],
})
export class AriModule {}
