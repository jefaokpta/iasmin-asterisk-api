import { Injectable, Logger } from '@nestjs/common';
import { Bridge, Channel, Client } from 'ari-client';
import { ChannelLeg } from './enus/channel-leg.enum';

@Injectable()
export class CallAction {
  private readonly logger = new Logger(CallAction.name);

  answerChannel(channel: Channel) {
    channel
      .answer()
      .catch((err) =>
        this.logger.error(
          `Erro ao atender canal ${channel.name} ${err.message}`,
        ),
      );
  }

  ringChannel(channel: Channel) {
    channel
      .ring()
      .catch((err) =>
        this.logger.error(
          `Erro ao iniciar ring do canal ${channel.name} ${err.message}`,
        ),
      );
  }

  hangupChannel(channel: Channel) {
    channel
      .hangup()
      .catch((err) =>
        this.logger.error(
          `Erro ao desligar canal ${channel.name} ${err.message}`,
        ),
      );
  }

  stasisEndChannelA(channelA: Channel, channelB: Channel) {
    this.logger.log(`Canal A ${channelA.name} finalizou a chamada`);
    this.hangupChannel(channelB);
  }

  stasisEndChannelB(channelA: Channel, channelB: Channel, bridge: Bridge) {
    this.logger.log(`Canal B ${channelB.name} finalizou a chamada`);
    this.hangupChannel(channelA);
    this.bridgeDestroy(bridge, channelB);
  }

  async createBridgeForChannels(
    ari: Client,
    channelA: Channel,
    channelB: Channel,
  ) {
    const bridge = ari.Bridge();

    this.answerChannel(channelA);

    channelB.on('StasisEnd', (event, channelB) => {
      this.stasisEndChannelB(channelA, channelB, bridge);
    });

    await bridge.create({ type: 'mixing' }).catch((err) => {
      this.logger.error('Erro ao criar bridge', err.message);
    });

    this.addChannelsToBridge(channelA, channelB, bridge);
    this.recordBridge(bridge, ari, channelA);
    this.recordChannel(channelA, ari, ChannelLeg.A);
    this.recordChannel(channelB, ari, ChannelLeg.B);
    return bridge;
  }

  private recordBridge(bridge: Bridge, ari: Client, channelA: Channel) {
    const recordingName = channelA.id.replace('.', '-');
    bridge
      .record(
        { name: recordingName, format: 'sln' },
        ari.LiveRecording(recordingName),
      )
      .catch((err) => this.logger.error('Erro ao gravar chamada', err.message));
  }

  private recordChannel(channel: Channel, ari: Client, channelLeg: ChannelLeg) {
    const recordingName = `${channel.id.replace('.', '-')}-${channelLeg}`;
    channel
      .record(
        { name: recordingName, format: 'sln' },
        ari.LiveRecording(recordingName),
      )
      .catch((err) =>
        this.logger.error(`Erro ao gravar canal ${channel.name}`, err.message),
      );
  }

  private bridgeDestroy(bridge: Bridge, channel: Channel) {
    bridge
      .destroy()
      .catch((err) =>
        this.logger.error(
          `Erro ao destruir bridge do canal ${channel.name} ${err.message}`,
        ),
      );
  }

  private addChannelsToBridge(
    channelA: Channel,
    channelB: Channel,
    bridge: Bridge,
  ) {
    bridge
      .addChannel({ channel: [channelA.id, channelB.id] })
      .catch((err) =>
        this.logger.error(
          `Erro ao adicionar canais ${channelA.name} e ${channelB.name} à bridge ${bridge.id}`,
          err.message,
        ),
      );
  }
}