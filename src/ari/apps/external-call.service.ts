/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallAction } from './util/call-action';
@Injectable()
export class ExternalCallService {
  constructor(
    private readonly configService: ConfigService, 
    private readonly callAction: CallAction) {}

  originateExternalCall(ari: Client, channelA: Channel) {
    this.callAction.ringChannel(channelA);
    const channelB = ari.Channel();

    channelA.on('StasisEnd', (event, channelA) => {
      this.callAction.stasisEndChannelA(channelA, channelB);
    })

    channelB.on('StasisStart', (event: StasisStart, channelB: Channel) => {
      clearTimeout(dialTimeout);
      this.callAction.createBridgeForChannels(ari, channelA, channelB);
    })

    channelB.originate({
        endpoint: `PJSIP/${this.configService.get('PABX_TECH_PREFIX')}${channelA.dialplan.exten}@${this.configService.get('PABX_TRUNK')}`,
        app: 'router-call-app',
        appArgs: 'dialed',
        callerId: channelA.dialplan.exten,
        variables: {
          'PJSIP_HEADER(add,P-Asserted-Identity)': this.configService.get('PABX_COMPANY_IDENTITY'),
        }},
      (err) => {if (err) {Logger.error(err.message, 'ExternalCallService.OriginateDialedChannel')}},
    );

    const dialTimeout = setTimeout(() => {
      this.callAction.hangupChannel(channelA);
    }, 30000);

  }
  
}
