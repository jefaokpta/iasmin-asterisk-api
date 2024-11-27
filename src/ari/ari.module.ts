import { Module } from '@nestjs/common';
import { RouterCallAppService } from './apps/router-call-app.service';
import { SimpleExternalCallService } from './apps/util/simple-external-call.service';
import { SimpleInternalCallService } from './apps/util/simple-internal-call.service';

@Module({
  providers: [
    RouterCallAppService,
    SimpleExternalCallService,
    SimpleInternalCallService
  ],
})
export class AriModule {}
