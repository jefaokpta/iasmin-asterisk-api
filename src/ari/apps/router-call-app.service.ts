/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Channel, Client, connect, StasisStart } from 'ari-client';
import { BadRequestException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExternalCallService } from './external-call.service';
import { InternalCallService } from './internal-call.service';
import { HttpClientService } from '../../http-client/http-client.service';
import { CompanyCacheService } from '../../cache-control/company-cache.service';
import { CallActionService } from './util/call-action.service';
import { UserCacheService } from '../../cache-control/user-cache.service';
import { CallAllUsersService } from './call-all-users.service';

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
    private readonly callAllUsersService: CallAllUsersService,
  ) {}

  private readonly logger = new Logger(RouterCallAppService.name);

  async onApplicationBootstrap() {
    connect(this.configService.get('ARI_HOST')!, this.configService.get('ARI_USER')!, this.configService.get('ARI_PASS')!, (err, ari) => {
      if (err) this.logger.error(`💣️ Erro ao conectar ao Asterisk ${err.message}`);
      ari.on('StasisStart', (stasisStartEvent: StasisStart, channel: Channel) => {
        this.stasisStart(stasisStartEvent, channel, ari);
      });
      ari
        .start('router-call-app')
        .then(() => this.logger.log('Roteador de chamadas: router-call-app 🚀'))
        .catch((err) => this.logger.error(`💣️ Erro ao iniciar app router-call-app ${err.message}`));
    });

    this.logger.log('Carregando empresas...');
    this.companyCacheService.loadCompanies(await this.httpClientService.getCompanies());
    this.logger.log('Carregando usuários...');
    this.userCacheService.loadUsers(await this.httpClientService.getUsers());
  }

  private async stasisStart(event: StasisStart, channel: Channel, ari: Client) {
    if (event.args.includes('dialed')) return;

    if (Array.isArray(event.args) && event.args.filter((arg) => arg.startsWith('record')).length > 0) {
      const recordName = event.args[0].split(' ')[1];
      this.callAction.recordChannel(channel, ari, recordName);
      return;
    }

    try {
      const userfieldVar = await channel.getChannelVar({
        variable: 'CDR(userfield)',
      });

      if (userfieldVar.value === 'INBOUND') {
        const company = this.companyCacheService.findCompanyByPhone(channel.dialplan.exten);
        if (!company) throw new BadRequestException(`Não foi possível encontrar a empresa com o telefone ${channel.dialplan.exten}`);
        this.callAllUsersService.callAllUsers(ari, channel, company);
        return;
      }
    } catch (err) {
      this.logger.error('Erro ao processar ligacao de entrada', err.message);
      this.callAction.hangupChannel(channel);
    }

    try {
      const companyVar = await channel.getChannelVar({
        variable: 'CDR(company)',
      });
      const company = companyVar.value;
      let callToken = '';
      try {
        const callTokenVar = await channel.getChannelVar({
          variable: 'PJSIP_HEADER(read,X-CALL-TOKEN)',
        });
        callToken = callTokenVar.value;
      } catch (error) {
        this.logger.warn(`Não foi possível obter X-CALL-TOKEN: ${error.message}`);
      }

      this.logger.log(`Ligacao de ${channel.name} ${channel.caller.name} para ${channel.dialplan.exten} Empresa ${company} - token ${callToken}`);

      if (channel.dialplan.exten.length < 8) {
        this.internalCallService.originateInternalCall(ari, channel);
        return;
      }

      this.externalCallService.originateExternalCall(ari, channel, company);
    } catch (err) {
      this.logger.error('Erro ao processar ligacao de saida', err.message);
      this.callAction.hangupChannel(channel);
    }
  }
}
