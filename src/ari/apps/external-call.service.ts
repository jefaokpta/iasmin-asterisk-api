/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Channel, Client, StasisStart } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallActionService } from './util/call-action.service';
import { CompanyCacheService } from '../../cache-control/company-cache.service';
import { recordName } from './util/utils';
import { ChannelLeg } from './util/enus/channel-leg.enum';

@Injectable()
export class ExternalCallService {
  constructor(
    private readonly configService: ConfigService,
    private readonly callAction: CallActionService,
    private readonly cacheControlService: CompanyCacheService,
  ) {}

  private readonly logger = new Logger(ExternalCallService.name);

  async originateExternalCall(ari: Client, channelA: Channel, company: string) {
    this.callAction.ringChannel(channelA);
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
      this.callAction.createSnoopChannelAndRecord(channelA, recordName(channelA.id, ChannelLeg.A));
      this.callAction.createSnoopChannelAndRecord(channel, recordName(channelA.id, ChannelLeg.B));
      this.callAction.addChannesToBridge(bridgeMain, [channelA, channel]);
      this.callAction.recordBridge(bridgeMain, ari, recordName(channelA.id, ChannelLeg.MIXED));
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
      (err) => {
        if (err) {
          this.logger.error(`Erro ao originar channel B ${trunkName}`, err.message);
          this.callAction.hangupChannel(channelA);
        }
      },
    );
  }
}
