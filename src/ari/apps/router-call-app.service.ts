/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Channel, Client, connect, StasisStart } from 'ari-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { originateDialedChannel } from './util/utlis';
import { externalMediaCall } from './util/external-media-call';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap() {
    connect(
      this.configService.get('ARI_HOST')!,
      this.configService.get('ARI_USER')!,
      this.configService.get('ARI_PASS')!,
      this.ariReady,
    );
  }

  ariReady(error: Error, ari: Client) {
    if (error) throw error.message;

    function stasisStart(stasisStartEvent: StasisStart, channel: Channel) {
      const company = stasisStartEvent.args[1];
      Logger.log(`Channel ${channel.name} entrou no Stasis Company ${company}`, 'RouterCallAppService');
      if (channel.dialplan.exten === '123'){
        externalMediaCall(ari, channel);
        return;
      }
      if (company) originateDialedChannel(ari, channel);
    }

    ari.on('StasisStart', stasisStart)

    ari.start('router-call-app')
      .then(() => Logger.log('Roteador de chamadas: router-call-app 🚀', 'RouterCallAppService'))

  }
}