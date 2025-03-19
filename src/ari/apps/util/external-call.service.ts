/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Bridge, Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExternalCallService {
  constructor(private readonly configService: ConfigService) {}

  originateDialedChannel(ari: Client, channel: Channel) {
    channel.ring((err) => {if (err) throw err.message});
    const dialedChannel = ari.Channel();

    channel.on('StasisEnd', (stasisEnd, channel) => {
      this.originalChannelHangup(channel, dialedChannel);
    })

    dialedChannel.on('ChannelDestroyed', (event, dialedChannel) => {
      this.dialedChannelHangup(channel);
    })

    dialedChannel.on('StasisStart', (stasisStartEvent: StasisStart, dialedChannel: Channel) => {
      this.createBridgeForChannels(ari, channel, dialedChannel);
    })

    dialedChannel.originate({
        endpoint: `PJSIP/${this.configService.get('PABX_TECH_PREFIX')}${channel.dialplan.exten}@${this.configService.get('PABX_TRUNK')}`,
        timeout: 30,
        app: 'router-call-app',
        appArgs: 'dialed',
        callerId: channel.dialplan.exten,
        variables: {
          'PJSIP_HEADER(add,P-Asserted-Identity)': this.configService.get('PABX_COMPANY_IDENTITY'),
        }},
      (err) => {if (err) {Logger.error(err.message, 'ExternalCallService.OriginateDialedChannel')}},
    );
  }

  private async createBridgeForChannels(ari: Client, channel: Channel, dialedChannel: Channel) {
    const bridge = ari.Bridge();

    channel.answer()
      .catch((err) => {if (err) throw err.message});

    dialedChannel.on('StasisEnd', (stasisEnd, dialedChannel) => {
      this.bridgeDestroy(bridge, dialedChannel);
    })

    await bridge.create({type: 'mixing'})
      .then((bridge) => {
        Logger.log(`Bridge ${bridge.id} criada`, 'ExternalCallService.createBridgeForChannels');
        this.addChannelsToBridge(channel, dialedChannel, bridge);
      })
      .catch((err) => {Logger.error('Erro ao criar bridge', err.message, 'ExternalCallService.createBridgeForChannels')});

    bridge.record({
      name: 'nao_nomeia_a_gravacao',
      format: 'sln',
    }, ari.LiveRecording(channel.id.replace('.', '-')))
      .catch((err) => Logger.error('Erro ao gravar chamada', err.message));
  }

  private addChannelsToBridge(channel: Channel, dialedChannel: Channel, bridge: Bridge) {
    bridge.addChannel({channel: [channel.id, dialedChannel.id]}, (err) => {
      if (err) throw err.message;
      Logger.log(`Canais ${channel.id} e ${dialedChannel.id} adicionados à bridge ${bridge.id}`, 'ExternalCallService.addChannelsToBridge');
    });
  }

  private originalChannelHangup(channel: Channel, dialedChannel: Channel) {
    dialedChannel.hangup()
      .catch((err) => Logger.error(`Canal B ${dialedChannel.name} ja foi desligado`, err.message, 'ExternalCallService'));
  }

  private dialedChannelHangup(channel: Channel) {
    channel.hangup()
      .catch((err) => Logger.error(`Canal A ${channel.name} ja foi desligado`, err.message, 'ExternalCallService'));
  }

  private bridgeDestroy(bridge: Bridge, dialedChannel: Channel) {
    bridge.destroy()
      .catch((err) => Logger.error(`Bridge do canal ${dialedChannel.name} destruída`, err.message, 'ExternalCallService'));
  }

}
