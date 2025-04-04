import { Injectable, Logger } from '@nestjs/common';
import { Bridge, Channel, Client } from 'ari-client';
import { ChannelLeg } from './enus/channel-leg.enum';

@Injectable()
export class CallAction {
  private readonly logger = new Logger(CallAction.name);

  answerChannel(channel: Channel) {
    channel.answer().catch(err => this.logger.error(`Erro ao atender canal ${channel.name} ${err.message}`));
  }

  ringChannel(channel: Channel) {
    channel.ring().catch(err => this.logger.error(`Erro ao iniciar ring do canal ${channel.name} ${err.message}`));
  }

  hangupChannel(channel: Channel) {
    channel.hangup().catch(err => this.logger.error(`Erro ao desligar canal ${channel.name} ${err.message}`));
  }

  // stasisEndChannelA(channelA: Channel, channelB: Channel) {
  //   this.logger.log(`Canal A ${channelA.name} finalizou a chamada`);
  //   this.hangupChannel(channelB);
  // }

  // stasisEndChannelB(channelA: Channel, channelB: Channel, bridge: Bridge) {
  //   this.logger.log(`Canal B ${channelB.name} finalizou a chamada`);
  //   this.hangupChannel(channelA);
  //   this.bridgeDestroy(bridge, channelB);
  // }

  async createBridge(ari: Client) {
    const bridge = ari.Bridge();
    await bridge.create({ type: 'mixing' }).catch(err => {
      this.logger.error('Erro ao criar bridge', err.message);
    });
    return bridge;
  }

  dialTimeout(channel: Channel, timeout: number = 30000) {
    return setTimeout(() => {
      this.logger.warn(`Timeout de ${timeout}ms para canal ${channel.name} atendere a chamada`);
      this.hangupChannel(channel);
    }, timeout);
  }

  recordBridge(bridge: Bridge, ari: Client, channel: Channel, channelLeg: ChannelLeg) {
    this.logger.log(`Gravando ponte mixed do canal ${channel.name} - ${channelLeg}`);
    const recordingName = `${channel.id.replace('.', '-')}-${channelLeg}`;
    bridge
      .record({ name: recordingName, format: 'sln' }, ari.LiveRecording(recordingName))
      .catch(err => this.logger.error('Erro ao gravar chamada', err.message));
  }

  async recordChannel(channel: Channel, ari: Client, channelLeg: ChannelLeg) {
    const recordingName = `${channel.id.replace('.', '-')}-${channelLeg}`;
    await channel
      .record({ name: recordingName, format: 'sln' }, ari.LiveRecording(recordingName))
      .catch(err => this.logger.error(`Erro ao gravar canal ${channel.name}`, err.message));
  }

  bridgeDestroy(bridge: Bridge) {
    bridge.destroy().catch(err => this.logger.error(`Erro ao destruir bridge ${bridge.id}`, err.message));
  }

  addChannesToBridge(bridge: Bridge, channels: Channel[]) {
    bridge
      .addChannel({ channel: channels.map(c => c.id) })
      .catch(err =>
        this.logger.error(`Erro ao adicionar canais ${channels[0].name} à bridge ${bridge.id}`, err.message),
      );
  }

  async createSnoopChannel(targetChannel: Channel) {
    console.log(targetChannel);
    return await targetChannel
      .snoopChannel(
        {
          app: 'router-call-app',
          appArgs: 'dialed',
          spy: 'in', // Options: 'in', 'out', 'both'
          whisper: 'none', // Options: 'none', 'out', 'both'
        },
        targetChannel,
      )
      .catch(err => {
        throw Error(`Erro ao criar canal snoop ${err.message}`);
      });
  }
}
