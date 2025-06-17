import { Injectable, Logger } from '@nestjs/common';
import { Bridge, Channel, Client } from 'ari-client';

@Injectable()
export class CallActionService {
  private readonly logger = new Logger(CallActionService.name);

  answerChannel(channel: Channel) {
    channel.answer().catch((err) => this.logger.error(`Erro ao atender canal ${channel.name} ${err.message}`));
  }

  ringChannel(channel: Channel) {
    channel.ring().catch((err) => this.logger.error(`Erro ao iniciar ring do canal ${channel.name} ${err.message}`));
  }

  hangupChannel(channel: Channel) {
    channel.hangup().catch((err) => this.logger.error(`Erro ao desligar canal ${channel.name} ${err.message}`));
  }

  async createBridge(ari: Client) {
    const bridge = ari.Bridge();
    await bridge.create({ type: 'mixing' }).catch((err) => {
      this.logger.error('Erro ao criar bridge', err.message);
    });
    return bridge;
  }

  dialTimeout(channel: Channel, timeout: number = 30000) {
    return setTimeout(() => {
      this.logger.warn(`Timeout de ${timeout}ms para canal ${channel.name} atender a chamada`);
      this.hangupChannel(channel);
    }, timeout);
  }

  recordBridge(bridge: Bridge, ari: Client, recordName: string) {
    this.logger.log(`Gravando ponte mixed para ${recordName}`);
    bridge.record({ name: recordName, format: 'sln' }, ari.LiveRecording(recordName)).catch((err) => this.logger.error('Erro ao gravar chamada', err.message));
  }

  recordChannel(channel: Channel, ari: Client, recordName: string) {
    this.logger.debug(`Gravando canal ${channel.name} - ${channel.id} - ${recordName}`);
    channel
      .record({ name: recordName, format: 'sln' }, ari.LiveRecording(recordName))
      .catch((err) => this.logger.error(`Erro ao gravar canal ${channel.id} - ${channel.name}`, err.message));
  }

  bridgeDestroy(bridge: Bridge) {
    bridge.destroy().catch((err) => this.logger.error(`Erro ao destruir bridge ${bridge.id}`, err.message));
  }

  addChannelsToBridge(bridge: Bridge, channels: Channel[]) {
    bridge
      .addChannel({ channel: channels.map((c) => c.id) })
      .catch((err) => this.logger.error(`Erro ao adicionar canais ${channels[0].name} à bridge ${bridge.id}`, err.message));
  }
  async addChannelsToBridgeAsync(bridge: Bridge, channels: Channel[]) {
    await bridge.addChannel({ channel: channels.map((c) => c.id) });
  }

  createSnoopChannelAndRecord(targetChannel: Channel, recordName: string, ariApp: string) {
    this.logger.debug(`Criando canal snoop para canal ${targetChannel.id} ${targetChannel.name}`);
    targetChannel
      .snoopChannel(
        {
          app: ariApp,
          appArgs: `record ${recordName}`,
          spy: 'in', // Options: 'in', 'out', 'both'
          whisper: 'none', // Options: 'none', 'out', 'both'
        },
        targetChannel,
      )
      .catch((err) => this.logger.error(`Erro ao criar canal snoop para canal ${targetChannel.id} ${targetChannel.name}`, err.message));
  }
}
