/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 5/28/25
 */
import { CallActionService } from './util/call-action.service';
import { Injectable, Logger } from '@nestjs/common';
import { UserCacheService } from '../../cache-control/user-cache.service';
import { Bridge, Channel, Client, Endpoint, StasisStart } from 'ari-client';
import { User } from '../../peer/user';

@Injectable()
export class IncomingCallService {
  private readonly logger = new Logger(IncomingCallService.name);

  constructor(
    private readonly callAction: CallActionService,
    private readonly userCacheService: UserCacheService,
  ) {}

  async callAllUsers(ari: Client, channelA: Channel, company: string, ariApp: string) {
    this.logger.log('Chamando todos os usuários da empresa: ' + company);
    const users = this.userCacheService.getUsersByControlNumber(company);
    if (users.length === 0) {
      this.logger.warn('Não existe usuários da empresa: ' + company);
      this.callAction.hangupChannel(channelA);
      return;
    }
    const peers = await this.getPeers(ari);
    const dialedUsers: Channel[] = [];
    const dialTimeout = this.callAction.dialTimeout(channelA);
    channelA.once('StasisEnd', () => this.hangupAllChannels(dialedUsers, dialTimeout));
    this.callAction.ringChannel(channelA);
    this.filterFreeAndOfflineUsers(users, peers).forEach((user) => {
      const channelB = ari.Channel();
      dialedUsers.push(channelB);

      channelB.once('StasisStart', async (event: StasisStart, channel: Channel) => this.channelBAnswered(channelA, channel, dialedUsers, ari, dialTimeout));

      channelB
        .originate({
          endpoint: `PJSIP/${user.id.toString()}`,
          app: ariApp,
          appArgs: 'dialed',
          callerId: channelA.caller.number,
        })
        .catch((err) => {
          this.logger.error('Erro ao originar chamada', err.message);
          this.callAction.hangupChannel(channelA);
        });
    });
  }

  private async channelBAnswered(channelA: Channel, channelB: Channel, dialedUsers: Channel[], ari: Client, dialTimeout: any) {
    clearTimeout(dialTimeout);
    this.cancelOthersDials(channelB, dialedUsers);
    this.logger.log(`Canal ${channelB.name} atendeu a chamada de ${channelA.caller.number}`);
    channelA.removeAllListeners('StasisEnd');
    channelA.once('StasisEnd', (event, channel) => this.channelAHangup(channel, channelB));
    channelB.once('StasisEnd', (event, channel) => this.channelBHangup(channelA, channel, bridge));
    this.callAction.answerChannel(channelA);
    const bridge = await this.callAction.createBridge(ari);
    this.callAction.addChannesToBridge(bridge, [channelA, channelB]);
  }

  private channelBHangup(channelA: Channel, channelB: Channel, bridge: Bridge) {
    this.logger.log(`Canal B ${channelB.id} finalizou a chamada`);
    this.callAction.hangupChannel(channelA);
    this.callAction.bridgeDestroy(bridge);
  }

  private channelAHangup(channelA: Channel, channelB: Channel) {
    this.logger.log(`Canal A ${channelA.name} finalizou a chamada`);
    this.callAction.hangupChannel(channelB);
  }

  private cancelOthersDials(channelAttendant: Channel, dialedUsers: Channel[]) {
    dialedUsers
      .filter((channel) => channel.id !== channelAttendant.id)
      .forEach((channel) => {
        this.callAction.hangupChannel(channel);
      });
  }

  private hangupAllChannels(dialedUsers: Channel[], dialTimeout: any) {
    clearTimeout(dialTimeout);
    dialedUsers.forEach((channel) => this.callAction.hangupChannel(channel));
  }

  private getPeers(ari: Client): Promise<Endpoint[]> {
    return ari.endpoints.list();
  }

  private filterFreeAndOfflineUsers(users: User[], peers: Endpoint[]): User[] {
    return users
      .filter((user) => user.roles.length > 1)
      .filter((user) => peers.find((peer) => peer.resource === user.id.toString() && peer.state === 'online'));
  }
}
