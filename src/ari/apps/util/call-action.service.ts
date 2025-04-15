import { Injectable, Logger } from '@nestjs/common';
import { Bridge, Channel, Client } from 'ari-client';

@Injectable()
export class CallActionService {
  private readonly logger = new Logger(CallActionService.name);

  answerChannel(channel: Channel) {
    channel.answer().catch(err => this.logger.error(`Erro ao atender canal ${channel.name} ${err.message}`));
  }

  ringChannel(channel: Channel) {
    channel.ring().catch(err => this.logger.error(`Erro ao iniciar ring do canal ${channel.name} ${err.message}`));
  }

  hangupChannel(channel: Channel) {
    channel.hangup().catch(err => this.logger.error(`Erro ao desligar canal ${channel.name} ${err.message}`));
  }

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

  recordBridge(bridge: Bridge, ari: Client, recordName: string) {
    this.logger.log(`Gravando ponte mixed para ${recordName}`);
    bridge
      .record({ name: recordName, format: 'sln' }, ari.LiveRecording(recordName))
      .catch(err => this.logger.error('Erro ao gravar chamada', err.message));
  }

  private recordChannel(channel: Channel, ari: Client, recordName: string) {
    this.logger.debug(`Gravando canal ${channel.name} - ${channel.id} - ${recordName}`);
    channel
      .record({ name: recordName, format: 'sln' }, ari.LiveRecording(recordName))
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

  createSnoopChannelAndRecord(targetChannel: Channel, ari: Client, recordName: string) {
    this.logger.debug(`Criando canal snoop para canal ${targetChannel.id} ${targetChannel.name}`);
    targetChannel
      .snoopChannel(
        {
          app: 'router-call-app',
          appArgs: 'dialed',
          spy: 'in', // Options: 'in', 'out', 'both'
          whisper: 'none', // Options: 'none', 'out', 'both'
        },
        targetChannel,
      )
      .then(snoopChannel => {
        // Implementação com polling para verificar stasis se der erro de nao gravar pq o canal nao esta no stasis
        // let tentativas = 0;
        // const maxTentativas = 10; // Número máximo de tentativas
        // const intervalo = 500; // Intervalo em ms entre tentativas

        this.logger.debug(`snoop stasis ${snoopChannel.id} ${snoopChannel.state}`);
        ari.channels.get({ channelId: snoopChannel.id }).then(channel => {
          this.logger.debug(`ari get channel ${channel.id} ${channel.state}`);
        });
        this.recordChannel(snoopChannel, ari, recordName);
      })
      .catch(err => {
        throw Error(`Erro ao criar canal snoop ${err.message}`);
      });
  }
}
