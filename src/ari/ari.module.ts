import { Module } from '@nestjs/common';
import { AriService } from './ari.service';
import { RouterCallAppService } from './apps/router-call-app.service';
import { SimpleCallService } from './apps/util/simple-call.service';

@Module({
  providers: [
    AriService,
    RouterCallAppService,
    SimpleCallService
  ],
})
export class AriModule {}
