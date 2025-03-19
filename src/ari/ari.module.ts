import { Module } from '@nestjs/common';
import { RouterCallAppService } from './apps/router-call-app.service';
import { ExternalCallService } from './apps/util/external-call.service';
import { InternalCallService } from './apps/util/internal-call.service';

@Module({
  providers: [
    RouterCallAppService,
    ExternalCallService,
    InternalCallService
  ],
})
export class AriModule {}
