/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { CallActionService } from './util/call-action.service';

@Injectable()
export class InternalCallService {
  constructor(private readonly callAction: CallActionService) {}

  private readonly logger = new Logger(InternalCallService.name);

  internalCall(ari: Client, channelA: Channel, ariApp: string) {
    const channelB = ari.Channel();
    const dialTimeout = this.callAction.dialTimeout(channelA);

    channelA.once('StasisEnd', (event, channel) => {
      this.logger.log(`Canal A ${channel.name} finalizou a chamada`);
      this.callAction.hangupChannel(channelB);
    });

    channelB.once('StasisStart', async (event: StasisStart, channel: Channel) => {
      clearTimeout(dialTimeout);
      this.callAction.answerChannel(channelA);
      const bridgeMain = await this.callAction.createBridge(ari);
      channel.once('StasisEnd', (event, c) => {
        this.logger.log(`Canal B ${c.id} finalizou a chamada`);
        this.callAction.hangupChannel(channelA);
        this.callAction.bridgeDestroy(bridgeMain);
      });
      this.callAction.addChannesToBridge(bridgeMain, [channelA, channel]);
    });

    channelB.on('ChannelStateChange', (event, channel) => {
      if (channel.state === 'Ringing') this.callAction.ringChannel(channelA);
    });

    channelB
      .originate({
        endpoint: `PJSIP/jefao`,
        app: ariApp,
        appArgs: 'dialed',
        callerId: channelA.caller.number,
      })
      .catch((err) => {
        this.logger.error(`Erro ao originar chamada ${channelA.name}`, err.message);
        this.callAction.hangupChannel(channelA);
      });
  }
}
