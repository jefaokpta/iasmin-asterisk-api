/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { CallActionService } from '../util/call-action.service';
import { InternalCallService } from './internal-call.service';
import { recordName } from '../util/utils';
import { ChannelLeg } from '../util/enus/channel-leg.enum';

@Injectable()
export class AssistantCallService {
  constructor(private readonly callAction: CallActionService) {}

  private readonly logger = new Logger(InternalCallService.name);

  async assistantCall(ari: Client, channelA: Channel, ariApp: string) {
    const channelB = await channelA.create({
      endpoint: `PJSIP/5511914317014@VAPI`,
      app: ariApp,
      appArgs: 'dialed',
    });

    channelB.once('StasisStart', async (event, channel) => {
      this.logger.debug(`Canal B ${channel.name} entrou no StasisApp`);
      clearTimeout(dialTimeout);
      this.dialChannelB(channelA, channelB);
    });

    channelA.once('StasisEnd', (event, channel) => {
      this.logger.log(`Canal A ${channel.name} finalizou a chamada`);
      this.callAction.hangupChannel(channelB);
    });

    channelB.on('ChannelStateChange', (event, channel) => {
      if (channel.state === 'Ringing') this.callAction.ringChannel(channelA);
      if (channel.state === 'Up') this.channelBAnsweredCall(channelA, channelB, ari);
    });

    const dialTimeout = setTimeout(() => {
      this.dialChannelB(channelA, channelB);
    }, 1000);
  }

  private async dialChannelB(channelA: Channel, channelB: Channel) {
    this.logger.log(`Executando dial ${channelB.name}`);
    try {
      await this.callAction.setChannelVar(channelB, 'PJSIP_HEADER(add,X-uniqueid)', channelA.id);
      await this.callAction.setChannelVar(channelB, 'PJSIP_HEADER(add,X-src)', channelA.caller.number);
      await this.callAction.setChannelVar(channelB, 'PJSIP_HEADER(add,X-destination)', channelA.dialplan.exten);
      channelB.dial({ timeout: 30 });
    } catch (err) {
      this.logger.error(`${channelA.name} Erro ao discar para: ${channelB.name} ${channelA.dialplan.exten}`, err.message);
      this.callAction.hangupChannel(channelA);
      return;
    }
  }

  private async channelBAnsweredCall(channelA: Channel, channelB: Channel, ari: Client) {
    this.callAction.answerChannel(channelA);
    const bridgeMain = await this.callAction.createBridge(ari);
    channelB.once('StasisEnd', (event, c) => {
      this.logger.log(`Canal B ${c.id} finalizou a chamada`);
      this.callAction.hangupChannel(channelA);
      this.callAction.bridgeDestroy(bridgeMain);
    });
    this.callAction.addChannelsToBridge(bridgeMain, [channelA, channelB]);
    this.callAction.recordBridge(bridgeMain, ari, recordName(channelA.id, ChannelLeg.MIXED));
  }
}
