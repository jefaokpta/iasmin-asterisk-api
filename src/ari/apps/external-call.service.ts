/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallAction } from './util/call-action';
import { CacheControlService } from '../../cache-control/cache-control.service';

@Injectable()
export class ExternalCallService {
  constructor(
    private readonly configService: ConfigService,
    private readonly callAction: CallAction,
    private readonly cacheControlService: CacheControlService,
  ) {}

  private readonly logger = new Logger(ExternalCallService.name);

  async originateExternalCall(ari: Client, channelA: Channel, company: string) {
    this.callAction.ringChannel(channelA);
    const channelB = ari.Channel();

    channelA.on('StasisEnd', (event, channelA) => {
      this.callAction.stasisEndChannelA(channelA, channelB);
    });

    channelB.on('StasisStart', (event: StasisStart, channelB: Channel) => {
      clearTimeout(dialTimeout);
      this.callAction.createBridgeForChannels(ari, channelA, channelB);
    });

    const callerId = await this.cacheControlService.getCompanyPhone(company);
    if (!callerId) {
      this.logger.warn(`Falta definir telefone da empresa: ${company}`);
      this.callAction.hangupChannel(channelA);
    }
    channelB.originate(
      {
        endpoint: `PJSIP/${this.configService.get('PABX_TECH_PREFIX')}${channelA.dialplan.exten}@${this.configService.get('PABX_TRUNK')}`,
        app: 'router-call-app',
        appArgs: 'dialed',
        callerId,
        variables: {
          'PJSIP_HEADER(add,P-Asserted-Identity)': this.configService.get(
            'PABX_COMPANY_IDENTITY',
          ),
        },
      },
      (err) => {
        if (err) {
          Logger.error(
            err.message,
            'ExternalCallService.OriginateDialedChannel',
          );
        }
      },
    );

    const dialTimeout = setTimeout(() => {
      this.callAction.hangupChannel(channelA);
    }, 30000);
  }
}
