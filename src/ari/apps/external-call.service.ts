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
    const dialTimeout = this.callAction.dialTimeout(channelA);

    channelA.on('StasisEnd', (event, channel) => {
      this.logger.log(`Canal A ${channel.name} finalizou a chamada`);
      this.callAction.hangupChannel(channelB);
    });

    channelB.on('StasisStart', async (event: StasisStart, channel: Channel) => {
      clearTimeout(dialTimeout);
      this.callAction.answerChannel(channelA);
      const bridge = await this.callAction.createBridge(ari);
      channel.on('StasisEnd', (event, c) => {
        this.logger.log(`Canal B ${c.name} finalizou a chamada`);
        this.callAction.hangupChannel(channelA);
        this.callAction.bridgeDestroy(bridge);
      });
    });

    const callerId = await this.cacheControlService.getCompanyPhone(company);
    if (!callerId) {
      this.logger.warn(`Falta definir telefone da empresa: ${company}`);
      this.callAction.hangupChannel(channelA);
    }
    const trunkName = this.configService.get('PABX_TRUNK');
    if (!trunkName) {
      this.logger.warn(`Falta definir trunk de saida: ${trunkName}`);
      this.callAction.hangupChannel(channelA);
    }
    const techPrefix = this.configService.get('PABX_TECH_PREFIX');
    if (!techPrefix) {
      this.logger.warn(`Falta definir techPrefix: ${techPrefix}`);
      this.callAction.hangupChannel(channelA);
    }
    channelB.originate(
      {
        endpoint: `PJSIP/${techPrefix}${channelA.dialplan.exten}@${trunkName}`,
        app: 'router-call-app',
        appArgs: 'dialed',
        callerId,
        variables: {
          'PJSIP_HEADER(add,P-Asserted-Identity)': company,
        },
      },
      err => {
        if (err) {
          this.logger.error(`Erro ao originar channel B ${trunkName}`, err.message);
          this.callAction.hangupChannel(channelA);
        }
      },
    );
  }
}
