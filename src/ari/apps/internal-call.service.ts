/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { CallAction } from './util/call-action';

@Injectable()
export class InternalCallService {
  constructor(private readonly callAction: CallAction) {}

  originateInternalCall(ari: Client, channelA: Channel) {
    this.callAction.ringChannel(channelA);
    const channelB = ari.Channel();

    channelA.on('StasisEnd', (event, channelA) => {
      this.callAction.stasisEndChannelA(channelA, channelB);
    })

    channelB.on('StasisStart', (stasisStartEvent: StasisStart, channelB: Channel) => {
      clearTimeout(dialTimeout);
      this.callAction.createBridgeForChannels(ari, channelA, channelB);
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
