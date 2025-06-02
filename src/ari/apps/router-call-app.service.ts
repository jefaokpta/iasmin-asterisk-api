/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Channel, Client, connect, StasisStart } from 'ari-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalCallService } from './external-call.service';
import { InternalCallService } from './internal-call.service';
import { HttpClientService } from '../../http-client/http-client.service';
import { CompanyCacheService } from '../../cache-control/company-cache.service';
import { CallActionService } from './util/call-action.service';
import { UserCacheService } from '../../cache-control/user-cache.service';
import { IncomingCallService } from './incoming-call.service';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly externalCallService: ExternalCallService,
    private readonly internalCallService: InternalCallService,
    private readonly httpClientService: HttpClientService,
    private readonly companyCacheService: CompanyCacheService,
    private readonly userCacheService: UserCacheService,
    private readonly callAction: CallActionService,
    private readonly incomingCallService: IncomingCallService,
  ) {}

  private readonly logger = new Logger(RouterCallAppService.name);

  async onApplicationBootstrap() {
    this.logger.log('Carregando empresas...');
    this.companyCacheService.loadCompanies(await this.httpClientService.getCompanies());
    this.logger.log('Carregando usuários...');
    this.userCacheService.loadUsers(await this.httpClientService.getUsers());

    connect(this.configService.get('ARI_HOST')!, this.configService.get('ARI_USER')!, this.configService.get('ARI_PASS')!)
      .then((ari) => {
        ari.on('StasisStart', (stasisStartEvent: StasisStart, channel: Channel) => {
          this.outboundStasisStart(stasisStartEvent, channel, ari);
        });

        ari
          .start('outbound-router-call-app')
          .then(() => this.logger.log('Roteador de chamadas: outbound-router-call-app 🚀'))
          .catch((err) => this.logger.error('💣️ Erro ao iniciar app outbound-router-call-app', err.message));
      })
      .catch((err) => this.logger.error('💣️ Erro ao conectar ao Asterisk', err.message));

    connect(this.configService.get('ARI_HOST')!, this.configService.get('ARI_USER')!, this.configService.get('ARI_PASS')!)
      .then((ari) => {
        ari.on('StasisStart', (stasisStartEvent: StasisStart, channel: Channel) => {
          this.inboundStasisStart(stasisStartEvent, channel, ari);
        });

        ari
          .start('inbound-router-call-app')
          .then(() => this.logger.log('Roteador de chamadas: inbound-router-call-app 🚀'))
          .catch((err) => this.logger.error('💣️ Erro ao iniciar app inbound-router-call-app', err.message));
      })
      .catch((err) => this.logger.error('💣️ Erro ao conectar ao Asterisk', err.message));
  }

  private async outboundStasisStart(event: StasisStart, channel: Channel, ari: Client, ariApp = 'outbound-router-call-app') {
    if (this.initialStasisStartCheck(event, channel, ari)) return;

    try {
      channel.setChannelVar({ variable: 'CDR(userfield)', value: 'OUTBOUND' });
      const companyVar = await channel.getChannelVar({ variable: 'CDR(company)' });
      const company = companyVar.value;
      let callToken = '';
      try {
        const callTokenVar = await channel.getChannelVar({
          variable: 'PJSIP_HEADER(read,X-CALL-TOKEN)',
        });
        callToken = callTokenVar.value;
      } catch (error) {
        this.logger.warn(`Webphone invalido - Não foi possível obter X-CALL-TOKEN: ${error.message}`);
        this.callAction.hangupChannel(channel);
        return;
      }

      this.logger.log(
        `Ligacao de ${channel.name} ${channel.caller.name} ${channel.caller.number} para ${channel.dialplan.exten} Empresa ${company} - token ${callToken}`,
      );

      if (channel.dialplan.exten.length < 8) {
        this.internalCallService.internalCall(ari, channel, ariApp);
        return;
      }

      this.externalCallService.externalCall(ari, channel, company, ariApp);
    } catch (err) {
      this.logger.error('Erro ao processar ligacao de saida', err.message);
      this.callAction.hangupChannel(channel);
    }
  }

  private inboundStasisStart(event: StasisStart, channel: Channel, ari: Client, ariApp = 'inbound-router-call-app') {
    if (this.initialStasisStartCheck(event, channel, ari)) return;

    this.logger.log(`Ligacao de entrada ${channel.name} ${channel.caller.name} ${channel.caller.number} para ${channel.dialplan.exten}`);

    try {
      channel.setChannelVar({ variable: 'CDR(userfield)', value: 'INBOUND' });
      const company = this.companyCacheService.findCompanyByPhone(channel.dialplan.exten);
      this.incomingCallService.callAllUsers(ari, channel, company!, ariApp);
    } catch (err) {
      this.logger.error('Erro ao processar ligacao de entrada', err.message);
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
