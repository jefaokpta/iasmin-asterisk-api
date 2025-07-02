/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { CallActionService } from './util/call-action.service';

@Injectable()
export class InternalCallService {
  constructor(private readonly callAction: CallActionService) {}

  private readonly logger = new Logger(InternalCallService.name);

  async internalCall(ari: Client, channelA: Channel, ariApp: string) {
    const channelB = await channelA.create({
      endpoint: `PJSIP/5511914317014@VAPI`,
      app: ariApp,
      appArgs: 'dialed',
    });

    channelA.once('StasisEnd', (event, channel) => {
      this.logger.log(`Canal A ${channel.name} finalizou a chamada`);
      this.callAction.hangupChannel(channelB);
    });

    channelB.on('ChannelStateChange', (event, channel) => {
      if (channel.state === 'Ringing') this.callAction.ringChannel(channelA);
      if (channel.state === 'Up') this.channelBAnsweredCall(channelA, channelB, ari);
    });

    if (channelA.dialplan.exten !== '12345') {
      //TODO: nao gastar creditos VAPI
      this.callAction.hangupChannel(channelA);
      return;
    }
    try {
      await this.callAction.setChannelVar(channelB, 'PJSIP_HEADER(add,X-uniqueid)', channelA.id);
      await this.callAction.setChannelVar(channelA, 'CALLERID(all)', '11914317014');
      channelB.dial({ timeout: 30 });
    } catch (err) {
      this.logger.error(`${channelA.name} Erro ao discar para: ${channelB.name} ${channelA.dialplan.exten}`, err.message);
      this.callAction.hangupChannel(channelA);
      return;
    }

    // channelB
    //   .originate({
    //     endpoint: `PJSIP/5511914317014@VAPI`,
    //     app: ariApp,
    //     appArgs: 'dialed',
    //     callerId: `${channelA.caller.name} <${channelA.caller.number}>`,
    //   })
    //   .catch((err) => {
    //     this.logger.error(`Erro ao originar chamada ${channelA.name}`, err.message);
    //     this.callAction.hangupChannel(channelA);
    //   });
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
  }
}
