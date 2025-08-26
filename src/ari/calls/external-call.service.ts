/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/11/24
 */
import { Bridge, Channel, Client } from 'ari-client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallActionService } from '../util/call-action.service';
import { recordName } from '../util/utils';
import { ChannelLeg } from '../util/enus/channel-leg.enum';

@Injectable()
export class ExternalCallService {
  constructor(
    private readonly configService: ConfigService,
    private readonly callAction: CallActionService,
  ) {}

  private readonly logger = new Logger(ExternalCallService.name);

  async externalCall(ari: Client, channelA: Channel, controlNumber: string, ddr: string, ariApp: string) {
    const trunkName = this.configService.get('PABX_TRUNK');
    if (!trunkName) {
      this.logger.warn(`${channelA.id} >> Falta definir trunk de saida: ${trunkName}`);
      this.callAction.hangupChannel(channelA);
      return;
    }

    const techPrefix = this.configService.get('PABX_TECH_PREFIX');
    if (!techPrefix) {
      this.logger.warn(`${channelA.id} >> Falta definir techPrefix: ${techPrefix}`);
      this.callAction.hangupChannel(channelA);
      return;
    }

    this.logger.debug(`${channelA.id} >> Telefone da empresa: ${ddr}`);

    const channelB = ari.Channel();

    const bridgeMain = await this.callAction.createBridge(ari);

    channelB.once('StasisStart', async (event, channel) => {
      this.logger.debug(`${channelA.id} >> Canais ${channelA.name} e ${channel.name} add a bridge`);
      await this.callAction.addChannelsToBridgeAsync(bridgeMain, [channelA, channel]);
      this.logger.debug(`${channelA.id} >> Canal B ${channel.name} entrou no stasis start`);
      this.channelBAnsweredCall(channelA, channel, bridgeMain, ari, ariApp);
    });

    channelA.once('StasisEnd', (event, channel) => {
      this.logger.log(`${channel.id} >> Canal A ${channel.name} desligou a chamada`);
      this.callAction.hangupChannel(channelB);
      this.callAction.bridgeDestroy(bridgeMain);
    });

    channelB.once('ChannelDestroyed', (event, channel) => {
      this.logger.log(`${channelA.id} >> Canal B ${channel.name} cancelou a chamada`);
      this.callAction.hangupChannel(channelA);
    });

    channelB.on('ChannelStateChange', (event, channel) => {
      console.log(channel.state);
      // if (channel.state === 'Ringing') this.callAction.ringChannel(channelA);
    });

    await channelB.originate({
      endpoint: `PJSIP/${techPrefix}${channelA.dialplan.exten}@${trunkName}`,
      app: ariApp,
      appArgs: 'dialed',
      timeout: 30,
      originator: channelA.id,
      variables: {
        'PJSIP_HEADER(add,P-Asserted-Identity)': controlNumber,
        'CONNECTEDLINE(all)': ddr,
      },
    });

    this.logger.debug(`${channelA.id} >> TESTE Canais ${channelA.name} e ${channelB.name}`);

  }

  private channelBAnsweredCall(channelA: Channel, channelB: Channel, bridgeMain: Bridge, ari: Client, ariApp: string) {
    this.logger.log(`${channelA.id} >> Canal ${channelB.name} atendeu ${channelA.name}`);
    this.callAction.answerChannel(channelA);
    channelB.removeAllListeners('ChannelDestroyed');
    channelB.once('StasisEnd', (event, c) => {
      this.logger.log(`${channelA.id} >> Canal B ${c.id} desligou a chamada`);
      this.callAction.hangupChannel(channelA);
    });
    this.callAction.createSnoopChannelAndRecord(channelA, recordName(channelA.id, ChannelLeg.A), ariApp);
    this.callAction.createSnoopChannelAndRecord(channelB, recordName(channelA.id, ChannelLeg.B), ariApp);
    this.callAction.recordBridge(bridgeMain, ari, recordName(channelA.id, ChannelLeg.MIXED));
  }
}
