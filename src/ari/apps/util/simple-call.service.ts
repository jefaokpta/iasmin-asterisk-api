/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Bridge, Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SimpleCallService{
  constructor(private readonly configService: ConfigService) {}

  private readonly AUDIO_RECORD = this.configService.get('AUDIO_RECORD')!;

  originateDialedChannel(ari: Client, channel: Channel) {
    channel.ring((err) => {if (err) throw err.message});
    const dialedChannel = ari.Channel();

    channel.on('StasisEnd', (stasisEnd, channel) => {
      this.originalChannelHangup(channel, dialedChannel);
    })

    dialedChannel.on('ChannelDestroyed', (event, dialedChannel) => {
      this.dialedChannelHangup(channel, dialedChannel);
    })

    dialedChannel.on('StasisStart', (stasisStartEvent: StasisStart, dialedChannel: Channel) => {
      this.createBridgeForChannels(ari, channel, dialedChannel);
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
      (err) => {if (err) {Logger.error(err.message, 'RouterCallAppService.OriginateDialedChannel')}},
    );
  }

  private createBridgeForChannels(ari: Client, channel: Channel, dialedChannel: Channel) {
    const bridge = ari.Bridge();

    channel.answer()
      .catch((err) => {if (err) throw err.message});

    dialedChannel.on('StasisEnd', (stasisEnd, dialedChannel) => {
      this.bridgeDestroy(bridge, dialedChannel);
    })

    bridge.create({type: 'mixing'})
      .then((bridge) => {
        Logger.log(`Bridge ${bridge.id} criada`, 'RouterCallAppService.createBridgeForChannels');
        this.addChannelsToBridge(channel, dialedChannel, bridge, ari);
      })
      .catch((err) => {if (err) throw err.message});
  }

  private addChannelsToBridge(channel: Channel, dialedChannel: Channel, bridge: Bridge, ari: Client) {
    ari.LiveRecording().listStored().then((recordings) => {
      Logger.log(`Gravações ativas: ${recordings.length}`, 'RouterCallAppService.addChannelsToBridge');
      recordings.forEach((recording) => Logger.log(recording.name));
    }) //todo: remove this line
    bridge.addChannel({channel: [channel.id, dialedChannel.id]}, (err) => {
      if (err) throw err.message;
      Logger.log(`Canais ${channel.id} e ${dialedChannel.id} adicionados à bridge ${bridge.id}`, 'RouterCallAppService.addChannelsToBridge');
    });
    bridge.record({
      name: this.createRecordFileName(channel),
      format: 'wav'
    }, ari.LiveRecording()) //todo: gerenciar fechamento de gravação no fim da chamada
      .catch((err) => Logger.error('Erro ao gravar chamada', err.message, 'RouterCallAppService'));
  }

  private originalChannelHangup(channel: Channel, dialedChannel: Channel) {
    Logger.log(`Canal ${channel.name} desligou, desligando ${dialedChannel.name}`, 'RouterCallAppService.originalChannelHangup')
    dialedChannel.hangup()
      .catch((err) => Logger.error('Canal Original desligado', err.message, 'RouterCallAppService'));
  }

  private dialedChannelHangup(channel: Channel, dialedChannel: Channel) {
    Logger.log(`Canal ${dialedChannel.name} desligou, desligando ${channel.name}`, 'RouterCallAppService.dialedChannelHangup')
    channel.hangup()
      .catch((err) => Logger.error('Canal Discado desligado', err.message, 'RouterCallAppService'));
  }

  private bridgeDestroy(bridge: Bridge, dialedChannel: Channel) {
    Logger.log(`Canal discado ${dialedChannel.name} desligou, Bridge ${bridge.id} será destruída`, 'RouterCallAppService.bridgeDestroy');
    bridge.destroy()
      .catch((err) => Logger.error(`Bridge do canal ${dialedChannel.name} destruída`, err.message, 'RouterCallAppService'));
  }

  private createRecordFileName(channel: Channel): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    return `${this.AUDIO_RECORD}/${date}_${time}_${channel.caller.number}_${channel.dialplan.exten}_${channel.id}.wav`;
  }

}
