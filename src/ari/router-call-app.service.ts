/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Channel, Client, connect, StasisStart } from 'ari-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalCallService } from './calls/external-call.service';
import { InternalCallService } from './calls/internal-call.service';
import { CallActionService } from './util/call-action.service';
import { IncomingCallService } from './calls/incoming-call.service';
import { SecurityService } from '../security/security.service';
import { AssistantCallService } from './calls/assistant-call.service';
import { CompanyClientService } from '../companies/company-client.service';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly externalCallService: ExternalCallService,
    private readonly internalCallService: InternalCallService,
    private readonly callAction: CallActionService,
    private readonly incomingCallService: IncomingCallService,
    private readonly securityService: SecurityService,
    private readonly assistantCallService: AssistantCallService,
    private readonly companyClientService: CompanyClientService,
  ) {}

  private readonly logger = new Logger(RouterCallAppService.name);
  private readonly OUTBOUND_APP_NAME = this.configService.get('ARI_APP_OUTBOUND_NAME') ?? 'outbound-router-call-app';
  private readonly INBOUND_APP_NAME = this.configService.get('ARI_APP_INBOUND_NAME') ?? 'inbound-router-call-app';

  async onApplicationBootstrap() {
    try {
      const outboundConnect = await connect(
        this.configService.get('ARI_HOST')!,
        this.configService.get('ARI_USER')!,
        this.configService.get('ARI_PASS')!,
      );
      outboundConnect.on('StasisStart', (stasisStartEvent: StasisStart, channel: Channel) => {
        this.outboundStasisStart(stasisStartEvent, channel, outboundConnect);
      });
      await outboundConnect.start(this.OUTBOUND_APP_NAME);
      this.logger.log(`Roteador de chamadas: ${this.OUTBOUND_APP_NAME} 🚀`);
    } catch (e) {
      this.logger.error(`💣️ Erro ao conectar ou iniciar app ${this.OUTBOUND_APP_NAME}`, e.message);
      throw e;
    }

    try {
      const inboundConnect = await connect(
        this.configService.get('ARI_HOST')!,
        this.configService.get('ARI_USER')!,
        this.configService.get('ARI_PASS')!,
      );
      inboundConnect.on('StasisStart', (stasisStartEvent: StasisStart, channel: Channel) => {
        this.inboundStasisStart(stasisStartEvent, channel, inboundConnect);
      });
      await inboundConnect.start(this.INBOUND_APP_NAME);
      this.logger.log(`Roteador de chamadas: ${this.INBOUND_APP_NAME} 🚀`);
    } catch (e) {
      this.logger.error(`💣️ Erro ao conectar ou iniciar app ${this.INBOUND_APP_NAME}`, e.message);
      throw e;
    }
  }

  private async outboundStasisStart(
    event: StasisStart,
    channel: Channel,
    ari: Client,
    ariApp = this.OUTBOUND_APP_NAME,
  ) {
    if (this.initialStasisStartCheck(event, channel, ari)) return;

    try {
      if (channel.caller.number !== 'jefao') {
        const callTokenVar = await channel.getChannelVar({
          variable: 'PJSIP_HEADER(read,X-CALL-TOKEN)',
        });
        this.securityService.validateToken(callTokenVar.value);
      }

      await channel.setChannelVar({ variable: 'CDR(userfield)', value: 'OUTBOUND' });
      const companyChannelVar = await channel.getChannelVar({ variable: 'CDR(company)' });
      const controlNumber = companyChannelVar.value;
      const ddrChannelVar = await channel.getChannelVar({ variable: 'PEER_DDR' });
      const ddr = ddrChannelVar.value;
      this.logger.log(
        `➡ Ligacao de ${channel.name} ${channel.caller.name} ${channel.caller.number} para ${channel.dialplan.exten} Empresa ${controlNumber} UNIQUEID ${channel.id}`,
      );

      if (channel.dialplan.exten.length < 8) {
        if (channel.dialplan.exten === '*12345') {
          this.assistantCallService.assistantCall(ari, channel, ariApp);
          return;
        }
        this.internalCallService.internalCall(ari, channel, ariApp);
        return;
      }
      this.externalCallService.externalCall(ari, channel, controlNumber, ddr, ariApp);
    } catch (err) {
      this.logger.error(`${channel.id} >> Erro ao processar ligação de saida`, err.message);
      this.callAction.hangupChannel(channel);
    }
  }

  private async inboundStasisStart(event: StasisStart, channel: Channel, ari: Client, ariApp = this.INBOUND_APP_NAME) {
    if (this.initialStasisStartCheck(event, channel, ari)) return;

    this.logger.log(
      `⬅ Ligacao de ${channel.name} ${channel.caller.name} ${channel.caller.number} para ${channel.dialplan.exten} UNIQUEID ${channel.id}`,
    );

    try {
      await channel.setChannelVar({ variable: 'CDR(userfield)', value: 'INBOUND' });
      const companyPhone = await this.companyClientService.findCompanyByPhone(channel.dialplan.exten);
      await channel.setChannelVar({ variable: 'CDR(company)', value: companyPhone.company.controlNumber });
      this.incomingCallService.callAllUsers(ari, channel, companyPhone, ariApp);
    } catch (err) {
      this.logger.error(`${channel.id} >> Erro ao processar ligacao de entrada`, err.message);
      this.callAction.hangupChannel(channel);
    }
  }

  private initialStasisStartCheck(event: StasisStart, channel: Channel, ari: Client): boolean {
    if (event.args.includes('dialed')) return true;

    if (Array.isArray(event.args) && event.args.filter((arg) => arg.startsWith('record')).length > 0) {
      const recordName = event.args[0].split(' ')[1];
      this.callAction.recordChannel(channel, ari, recordName);
      return true;
    }

    return false;
  }
}
