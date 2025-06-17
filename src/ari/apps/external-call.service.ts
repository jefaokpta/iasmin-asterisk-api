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

  async externalCall(ari: Client, channelA: Channel, company: string, ariApp: string) {
    const channelB = ari.Channel();
    const dialTimeout = this.callAction.dialTimeout(channelA);
    const bridgeMain = await this.callAction.createBridge(ari);
    await this.callAction.addChannelsToBridgeAsync(bridgeMain, [channelA, channelB]);

    channelA.once('StasisEnd', (event, channel) => {
      this.logger.log(`Canal A ${channel.name} finalizou a chamada`);
      this.callAction.bridgeDestroy(bridgeMain);
      this.callAction.hangupChannel(channelB);
      clearTimeout(dialTimeout);
    });

    channelB.once('StasisStart', async (event: StasisStart, channel: Channel) => {
      clearTimeout(dialTimeout);
      this.callAction.answerChannel(channelA);
      channel.removeAllListeners('ChannelDestroyed');
      channel.once('StasisEnd', (event, c) => {
        this.logger.log(`Canal B ${c.id} finalizou a chamada`);
        this.callAction.hangupChannel(channelA);
      });
      this.callAction.createSnoopChannelAndRecord(channelA, recordName(channelA.id, ChannelLeg.A), ariApp);
      this.callAction.createSnoopChannelAndRecord(channel, recordName(channelA.id, ChannelLeg.B), ariApp);
      this.callAction.recordBridge(bridgeMain, ari, recordName(channelA.id, ChannelLeg.MIXED));
    });

    const callerId = this.cacheControlService.getCompanyPhone(company);
    this.logger.debug(`Telefone da empresa: ${callerId}`);
    if (!callerId) {
      this.logger.warn(`Falta definir telefone da empresa: ${company}`);
      this.callAction.hangupChannel(channelA);
      return;
    }
    const trunkName = this.configService.get('PABX_TRUNK');
    if (!trunkName) {
      this.logger.warn(`Falta definir trunk de saida: ${trunkName}`);
      this.callAction.hangupChannel(channelA);
      return;
    }
    const techPrefix = this.configService.get('PABX_TECH_PREFIX');
    if (!techPrefix) {
      this.logger.warn(`Falta definir techPrefix: ${techPrefix}`);
      this.callAction.hangupChannel(channelA);
      return;
    }

    channelB.once('ChannelDestroyed', (event, channel) => {
      this.logger.log(`Canal B ${channel.name} cancelou a chamada`);
      this.callAction.hangupChannel(channelA);
    });

    channelB.on('ChannelStateChange', (event, channel) => {
      if (channel.state === 'Ringing') this.callAction.ringChannel(channelA);
    });

    channelB.originate(
      {
        endpoint: `PJSIP/${techPrefix}${channelA.dialplan.exten}@${trunkName}`,
        app: ariApp,
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
