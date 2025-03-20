import { Module } from '@nestjs/common';
import { RouterCallAppService } from './apps/router-call-app.service';
import { ExternalCallService } from './apps/external-call.service';
import { InternalCallService } from './apps/internal-call.service';
import { CallAction } from './apps/util/call-action';
@Module({
  providers: [
    RouterCallAppService,
    ExternalCallService,
    InternalCallService,
    CallAction
  ],
})
export class AriModule {}
