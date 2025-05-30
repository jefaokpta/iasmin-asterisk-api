/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 5/28/25
 */
import { CallActionService } from './util/call-action.service';
import { Injectable, Logger } from '@nestjs/common';
import { UserCacheService } from '../../cache-control/user-cache.service';
import { Channel, Client, Endpoint, StasisStart } from 'ari-client';

@Injectable()
export class CallAllUsersService {
  private readonly logger = new Logger(CallAllUsersService.name);

  constructor(
    private readonly callAction: CallActionService,
    private readonly userCacheService: UserCacheService,
  ) {}

  async callAllUsers(ari: Client, channelA: Channel, company: string) {
    this.logger.log('Chamando todos os usuários da empresa: ' + company);
    const users = await this.userCacheService.getUsersByControlNumber(company);
    if (users.length === 0) {
      this.logger.warn('Não existe usuários da empresa: ' + company);
      this.callAction.hangupChannel(channelA);
    }
    const peers = await this.getPeers(ari);
    const dialedUsers: Channel[] = [];
    const dialTimeout = this.callAction.dialTimeout(channelA);
    channelA.once('StasisEnd', () => this.hangupAllChannels(dialedUsers, dialTimeout));
    this.callAction.ringChannel(channelA);
    users
      .filter((user) => user.id.toString() !== channelA.caller.number)
      .filter((user) => peers.find((peer) => peer.resource === user.id.toString() && peer.state === 'online'))
      .forEach((user) => {
        const channelB = ari.Channel();
        dialedUsers.push(channelB);
        channelB.once('StasisStart', async (event: StasisStart, channel: Channel) => {
          clearTimeout(dialTimeout);
          this.cancelOthersDials(channel, dialedUsers);
          this.logger.log(`Canal ${channel.name} atendeu a chamada de ${channelA.caller.number}`);

          channelA.removeAllListeners('StasisEnd');
          channelA.once('StasisEnd', (event, channel) => {
            this.logger.log(`Canal A ${channel.name} finalizou a chamada`);
            this.callAction.hangupChannel(channelB);
          });

          channel.once('StasisEnd', (event, c) => {
            this.logger.log(`Canal B ${c.id} finalizou a chamada`);
            this.callAction.hangupChannel(channelA);
            this.callAction.bridgeDestroy(bridge);
          });
          this.callAction.answerChannel(channelA);
          const bridge = await this.callAction.createBridge(ari);
          this.callAction.addChannesToBridge(bridge, [channelA, channel]);
        });
        channelB
          .originate({
            endpoint: `PJSIP/${user.id.toString()}`,
            app: 'router-call-app',
            appArgs: 'dialed',
            callerId: channelA.caller.number,
          })
          .catch((err) => {
            this.logger.error('Erro ao originar chamada', err.message);
            this.callAction.hangupChannel(channelA);
          });
      });
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
}
