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

  private readonly logger = new Logger(InternalCallService.name);

  originateInternalCall(ari: Client, channelA: Channel) {
    this.callAction.ringChannel(channelA);
    const channelB = ari.Channel();
    const dialTimeout = this.callAction.dialTimeout(channelA);

    channelA.on('StasisEnd', (event, channelA) => {
      this.callAction.stasisEndChannelA(channelA, channelB);
    });

    channelB.on(
      'StasisStart',
      async (event: StasisStart, channelB: Channel) => {
        clearTimeout(dialTimeout);
        const bridge = await this.callAction.createBridgeForChannels(
          ari,
          channelA,
          channelB
        );
        channelB.on('StasisEnd', (event, channelB) => {
          this.callAction.stasisEndChannelB(channelA, channelB, bridge);
        });
      }
    );

    channelB
      .originate({
        endpoint: `PJSIP/${channelA.dialplan.exten}`,
        app: 'router-call-app',
        appArgs: 'dialed',
        callerId: channelA.caller.number,
      })
      .catch((err) => {
        this.logger.error('Erro ao originar chamada', err.message);
        this.callAction.hangupChannel(channelA);
      });
  }
}
