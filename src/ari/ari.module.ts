import { Module } from '@nestjs/common';
import { RouterCallAppService } from './apps/router-call-app.service';
import { SimpleCallService } from './apps/util/simple-call.service';

@Module({
  providers: [
    RouterCallAppService,
    SimpleCallService
  ],
})
export class AriModule {}
