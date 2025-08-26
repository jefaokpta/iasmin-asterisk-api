import { Module } from '@nestjs/common';
import { RouterCallAppService } from './router-call-app.service';
import { OutboundCallService } from './calls/outbound-call.service';
import { InternalCallService } from './calls/internal-call.service';
import { CallActionService } from './util/call-action.service';
import { InboundCallService } from './calls/inbound-call.service';
import { SecurityModule } from '../security/security.module';
import { AssistantCallService } from './calls/assistant-call.service';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [SecurityModule, CompaniesModule],
  providers: [
    RouterCallAppService,
    OutboundCallService,
    InternalCallService,
    CallActionService,
    InboundCallService,
    AssistantCallService,
  ],
})
export class AriModule {}
