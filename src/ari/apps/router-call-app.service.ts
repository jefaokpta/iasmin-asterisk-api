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

      channel.on('StasisEnd', () => {
        originalChannelHangup(channel, dialedChannel);
      })

      dialedChannel.on('ChannelDestroyed', () => {
        dialedChannelHangup(channel, dialedChannel);
      })

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

      channel.answer()
        .catch((err) => {if (err) throw err.message});

      dialedChannel.on('StasisEnd', () => {
        bridgeDestroy(bridge, dialedChannel);
      })

      bridge.create({type: 'mixing'})
        .then((bridge) => {
          Logger.log(`Bridge ${bridge.id} criada`, 'RouterCallAppService');
          addChannelsToBridge(channel, dialedChannel, bridge);
        })
        .catch((err) => {if (err) throw err.message});
    }

    function addChannelsToBridge(channel: Channel, dialedChannel: Channel, bridge: Bridge) {
      bridge.addChannel({channel: [channel.id, dialedChannel.id]}, (err) => {
        if (err) throw err.message;
        Logger.log(`Canais ${channel.id} e ${dialedChannel.id} adicionados à bridge ${bridge.id}`, 'RouterCallAppService');
      });

    }

    function originalChannelHangup(channel: Channel, dialedChannel: Channel) {
      Logger.log(`Canal ${channel.name} desligou, desligando ${dialedChannel.name}`, 'RouterCallAppService')
      dialedChannel.hangup()
        .catch((err) => Logger.error('Canal Original desligado', err.message, 'RouterCallAppService'));
    }

    function dialedChannelHangup(channel: Channel, dialedChannel: Channel) {
      Logger.log(`Canal ${dialedChannel.name} desligou, desligando ${channel.name}`, 'RouterCallAppService')
      channel.hangup()
        .catch((err) => Logger.error('Canal Discado desligado', err.message, 'RouterCallAppService'));
    }

    function bridgeDestroy(bridge: Bridge, dialedChannel: Channel) {
      Logger.log(`Canal discado ${dialedChannel.name} desligou, Bridge ${bridge.id} será destruída`, 'RouterCallAppService')
      bridge.destroy()
        .catch((err) => Logger.error(`Bridge do canal ${dialedChannel.name} destruída`, err.message, 'RouterCallAppService'));
    }

    ari.on('StasisStart', stasisStart)

    ari.start('router-call-app')
      .then(() => Logger.log('Roteador de chamadas: router-call-app 🚀', 'RouterCallAppService'))
  }
}