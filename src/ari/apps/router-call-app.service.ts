/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Bridge, Channel, Client, connect, StasisStart } from 'ari-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(private readonly configService: ConfigService) {}

  onApplicationBootstrap() {
    connect(
      this.configService.get('AST_HOST')!,
      this.configService.get('AST_USER')!,
      this.configService.get('AST_PASS')!,
      this.ariReady,
    );
  }

  ariReady(error: Error, ari: Client) {
    if (error) throw error.message;

    function stasisStart(stasisStartEvent: StasisStart, channel: Channel) {
      const company = stasisStartEvent.args[1];
      Logger.log(`Channel ${channel.name} entrou no Stasis Company ${company}`, 'RouterCallAppService');
      if (company) originateDialedChannel(channel);
    }

    function originateDialedChannel(channel: Channel) {
      channel.ring((err) => {if (err) throw err.message});
      const dialedChannel = ari.Channel();

      dialedChannel.on('StasisStart', (stasisStartEvent: StasisStart, dialedChannel: Channel) => {
        createBridgeForChannels(channel, dialedChannel);
      })

      dialedChannel.originate({
          endpoint: `PJSIP/101#${channel.dialplan.exten}@TWILLIO_JUPITER`,
          timeout: 30,
          app: 'router-call-app',
          appArgs: 'dialed',
          callerId: channel.dialplan.exten,
          variables: {
            'PJSIP_HEADER(add,P-Asserted-Identity)': '100023',
          }},
        (err) => {if (err) {Logger.error(err.message, 'RouterCallAppService')}},
      );
    }

    function createBridgeForChannels(channel: Channel, dialedChannel: Channel) {
      const bridge = ari.Bridge();

      channel.answer((err) => {if (err) throw err.message});

      bridge.create({type: 'mixing'}, (err, bridge) => {
        if (err) throw err.message;
        Logger.log(`Bridge ${bridge.id} criada`, 'RouterCallAppService');
      });

      addChannelsToBridge(channel, dialedChannel, bridge);
    }

    function addChannelsToBridge(channel: Channel, dialedChannel: Channel, bridge: Bridge) {
      bridge.addChannel({channel: [channel.id, dialedChannel.id]}, (err) => {
        if (err) throw err.message;
        Logger.log(`Canais ${channel.id} e ${dialedChannel.id} adicionados à bridge ${bridge.id}`, 'RouterCallAppService');
      });

    }
    //todo: tratar desligamentos de chamadas de ambos os lados
    ari.on('StasisStart', stasisStart)

    ari.start('router-call-app')
      .then(() => Logger.log('Roteador de chamadas: router-call-app 🚀', 'RouterCallAppService'))
  }
}