/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 5/28/25
 */
import { CallActionService } from './util/call-action.service';
import { Injectable, Logger } from '@nestjs/common';
import { UserCacheService } from '../../cache-control/user-cache.service';
import { Channel, Client, Endpoint } from 'ari-client';

@Injectable()
export class CallAllUsersService {
  constructor(
    private readonly callAction: CallActionService,
    private readonly userCacheService: UserCacheService,
  ) {}

  private readonly logger = new Logger(CallAllUsersService.name);

  async callAllUsers(ari: Client, channelA: Channel, company: string) {
    this.logger.log('Chamando todos os usuários da empresa: ' + company);
    const users = await this.userCacheService.getUsersByControlNumber(company);
    if (users.length === 0) {
      this.logger.warn('Não existe usuários da empresa: ' + company);
      this.callAction.hangupChannel(channelA);
    }
    const peers = await this.getPeers(ari);
    users
      .filter(user => user.id.toString() !== channelA.caller.number)
      .filter(user => peers.find(peer => peer.resource === user.id.toString() && peer.state === 'online'))
      .forEach(user => {
        this.logger.debug(user);
      });

    this.callAction.hangupChannel(channelA);
  }

  private dialPeer(ari: Client, channelA: Channel, dst: string) {
    this.callAction.ringChannel(channelA);

    channelA.dial({ caller: dst, timeout: 30 }, err => {
      if (err) {
        this.logger.error(`Erro ao originar channel B ${dst}`, err.message);
        this.callAction.hangupChannel(channelA);
      }
    });
    ari.channels.list().then(channels => {
      channels.forEach(channel => {
        channel.dial();
      });
    });
  }

  private getPeers(ari: Client): Promise<Endpoint[]> {
    return ari.endpoints.list();
  }
}