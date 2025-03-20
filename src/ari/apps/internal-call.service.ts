/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Bridge, Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { CallAction } from './util/call-action';

@Injectable()
export class InternalCallService {
  constructor(private readonly callAction: CallAction) {}

  originateInternalCall(ari: Client, channelA: Channel) {
    this.callAction.ringChannel(channelA);
    const channelB = ari.Channel();
    let bridge: Bridge;

    channelB.on('StasisStart', async (event: StasisStart, channelB: Channel) => {
      clearTimeout(dialTimeout);
      bridge = await this.callAction.createBridgeForChannels(ari, channelA, channelB);
    })

    channelA.on('StasisEnd', async (event, channelA) => {
      if (bridge) {
        await bridge.play({media: 'sound:vm-goodbye'})
          .catch((err) => Logger.error('Erro ao tocar arquivo', err.message, 'InternalCallService.originateInternalCall'));
          setTimeout(() => {
            this.callAction.stasisEndChannelA(channelA, channelB);
          }, 2000);
        return;
      }
      this.callAction.stasisEndChannelA(channelA, channelB);
    })

    channelB.originate({
        endpoint: `PJSIP/${channelA.dialplan.exten}`,
        app: 'router-call-app',
        appArgs: 'dialed',
        callerId: channelA.caller.number,
    }).catch((err) => {
      Logger.error('Erro ao originar chamada', err.message, 'InternalCallService.originateDialedChannel')
      this.callAction.hangupChannel(channelA);
    });

    const dialTimeout = setTimeout(() => {
      this.callAction.hangupChannel(channelA);
    }, 30000);

  }

}
