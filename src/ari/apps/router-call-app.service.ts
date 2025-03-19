/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Channel, Client, connect, StasisStart } from 'ari-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { externalMediaCall } from './util/external-media-call';
import { ExternalCallService } from './util/external-call.service';
import { InternalCallService } from './util/internal-call.service';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly simpleExternalCallService: ExternalCallService,
    private readonly simpleInternalCallService: InternalCallService
  ) {}

  onApplicationBootstrap() {
    connect(
      this.configService.get('ARI_HOST')!,
      this.configService.get('ARI_USER')!,
      this.configService.get('ARI_PASS')!,
      (error, ari) => {
        if (error) throw error.message;
        ari.on('StasisStart', (stasisStartEvent: StasisStart, channel: Channel) => {
          this.stasisStart(stasisStartEvent, channel, ari);
        })
        ari.start('router-call-app')
          .then(() =>
            Logger.log(
              'Roteador de chamadas: router-call-app 🚀',
              'RouterCallAppService',
            ),
          );
      }
    );
  }

  private async stasisStart(stasisStartEvent: StasisStart, channel: Channel, ari: Client) {
    if (stasisStartEvent.args.includes('dialed')) {
      Logger.log(`Chamada originada atendida ${channel.name}`, 'RouterCallAppService');
      return;
    }
    try {
      const companyVar = await channel.getChannelVar({variable: 'CDR(company)'});
      const company = companyVar.value;

      let callToken = '';
      try {
        const callTokenVar = await channel.getChannelVar({variable: 'PJSIP_HEADER(read,X-CALL-TOKEN)'});
        callToken = callTokenVar.value;
      } catch (error) {
        Logger.warn(`Não foi possível obter X-CALL-TOKEN: ${error.message}`, 'RouterCallAppService');
      }

      Logger.log(`Ligacao de ${channel.name} ${channel.caller.name} para ${channel.dialplan.exten} Empresa ${company} - token ${callToken}`, 'RouterCallAppService');
      
      if (!company) return;
      
      if (channel.dialplan.exten === '12345') {
        externalMediaCall(ari, channel);
        return;
      }
      
      if (channel.dialplan.exten.length < 8) {
        this.simpleInternalCallService.originateDialedChannel(ari, channel);
        return;
      }
      
      this.simpleExternalCallService.originateDialedChannel(ari, channel);

    } catch (error) {
      Logger.error(`Erro ao processar inicio da chamada: ${error.message}`, 'RouterCallAppService');
    }
  }

}