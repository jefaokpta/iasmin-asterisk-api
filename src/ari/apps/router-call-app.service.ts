/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Channel, Client, connect, StasisStart } from 'ari-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { externalMediaCall } from './util/external-media-call';
import { SimpleExternalCallService } from './util/simple-external-call.service';
import { SimpleInternalCallService } from './util/simple-internal-call.service';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly simpleExternalCallService: SimpleExternalCallService,
    private readonly simpleInternalCallService: SimpleInternalCallService
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

  private stasisStart(stasisStartEvent: StasisStart, channel: Channel, ari: Client) {
    const company = stasisStartEvent.args[1];
    Logger.log(`Ligacao de ${channel.name} ${channel.caller.name} para ${channel.dialplan.exten} Empresa ${company}`, 'RouterCallAppService');
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
  }

}