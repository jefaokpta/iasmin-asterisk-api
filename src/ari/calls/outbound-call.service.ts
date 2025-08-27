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
export class OutboundCallService {
  constructor(
    private readonly configService: ConfigService,
    private readonly callAction: CallActionService,
  ) {}

  private readonly logger = new Logger(OutboundCallService.name);

  async outboundCall(ari: Client, channelA: Channel, controlNumber: string, ddr: string, ariApp: string) {
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
    const bridgeMain = await this.callAction.createBridge(ari);

    const channelB = await ari.channels.create({
      endpoint: `PJSIP/${techPrefix}${channelA.dialplan.exten}@${trunkName}`,
      app: ariApp,
      appArgs: 'dialed',
      originator: channelA.id,
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
      if (channel.state === 'Up') this.channelBAnsweredCall(channelA, channel, bridgeMain, ari, ariApp);
    });

    await this.callAction.addChannelsToBridge(bridgeMain, [channelA.id, channelB.id]);
    await channelB.setChannelVar({ variable: 'PJSIP_HEADER(add,P-Asserted-Identity)', value: controlNumber });
    await channelB.setChannelVar({ variable: 'CONNECTEDLINE(all)', value: ddr });

    const debugSipHeader = await channelB.getChannelVar({ variable: 'PJSIP_HEADER(read,P-Asserted-Identity)' });
    const debugConnectedLine = await channelB.getChannelVar({ variable: 'CONNECTEDLINE(num)' });

    this.logger.debug(
      // TODO: remover
      `${channelA.id} >> Executando external dial para ${channelB.name} com origem: ${debugConnectedLine.value} SIP-Header: ${debugSipHeader.value}`,
    );
    await channelB.dial({ timeout: 30 });
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
