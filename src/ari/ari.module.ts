import { Module } from '@nestjs/common';
import { RouterCallAppService } from './apps/router-call-app.service';
import { ExternalCallService } from './apps/external-call.service';
import { InternalCallService } from './apps/internal-call.service';
import { CallActionService } from './apps/util/call-action.service';
import { HttpClientModule } from '../http-client/http-client.module';
import { CacheControlModule } from '../cache-control/cache-control.module';
import { IncomingCallService } from './apps/incoming-call.service';
import { UtilModule } from '../utils/util.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [HttpClientModule, CacheControlModule, UtilModule, SecurityModule],
  providers: [RouterCallAppService, ExternalCallService, InternalCallService, CallActionService, IncomingCallService],
})
export class AriModule {}
