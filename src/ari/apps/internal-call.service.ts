/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { CallActionService } from './util/call-action.service';
import { ChannelLeg } from './util/enus/channel-leg.enum';
import { recordName } from './util/utils';

@Injectable()
export class InternalCallService {
  constructor(private readonly callAction: CallActionService) {}

  private readonly logger = new Logger(InternalCallService.name);

  async originateInternalCall(ari: Client, channelA: Channel) {
    this.callAction.ringChannel(channelA);
    const channelB = ari.Channel();
    const dialTimeout = this.callAction.dialTimeout(channelA);

    channelA.on('StasisEnd', (event, channel) => {
      this.logger.log(`Canal A ${channel.name} finalizou a chamada`);
      this.callAction.hangupChannel(channelB);
    });

    channelB.on('StasisStart', async (event: StasisStart, channel: Channel) => {
      clearTimeout(dialTimeout);
      this.callAction.answerChannel(channelA);
      const bridgeMain = await this.callAction.createBridge(ari);
      channel.on('StasisEnd', (event, c) => {
        this.logger.log(`Canal B ${c.name} finalizou a chamada`);
        this.callAction.hangupChannel(channelA);
        this.callAction.bridgeDestroy(bridgeMain);
      });
      await this.callAction.createSnoopChannelAndRecord(channelA, ari, recordName(channelA.id, ChannelLeg.A));
      await this.callAction.createSnoopChannelAndRecord(channel, ari, recordName(channelA.id, ChannelLeg.B));
      this.callAction.addChannesToBridge(bridgeMain, [channelA, channel]);
      this.callAction.recordBridge(bridgeMain, ari, recordName(channelA.id, ChannelLeg.MAIN));
    });

    channelB
      .originate({
        endpoint: `PJSIP/${channelA.dialplan.exten}`,
        app: 'router-call-app',
        appArgs: 'dialed',
        callerId: channelA.caller.number,
      })
      .catch(err => {
        this.logger.error('Erro ao originar chamada', err.message);
        this.callAction.hangupChannel(channelA);
      });
  }
}
