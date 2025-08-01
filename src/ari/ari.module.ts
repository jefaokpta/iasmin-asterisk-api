import { Module } from '@nestjs/common';
import { RouterCallAppService } from './router-call-app.service';
import { ExternalCallService } from './calls/external-call.service';
import { InternalCallService } from './calls/internal-call.service';
import { CallActionService } from './util/call-action.service';
import { IncomingCallService } from './calls/incoming-call.service';
import { SecurityModule } from '../security/security.module';
import { AssistantCallService } from './calls/assistant-call.service';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    SecurityModule,
    CompaniesModule
  ],
  providers: [RouterCallAppService, ExternalCallService, InternalCallService, CallActionService, IncomingCallService, AssistantCallService],
})
export class AriModule {}
