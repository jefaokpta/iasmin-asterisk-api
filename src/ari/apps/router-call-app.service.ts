/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Channel, Client, connect, StasisStart } from 'ari-client';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { externalMediaCall } from './util/external-media-call';
import { SimpleCallService } from './util/simple-call.service';
import { exec } from 'node:child_process';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly simpleCallService: SimpleCallService,
  ) {}

  onApplicationBootstrap() {
    connect(
      this.configService.get('ARI_HOST')!,
      this.configService.get('ARI_USER')!,
      this.configService.get('ARI_PASS')!,
      (error, ari) => {
        if (error) throw error.message;
        ari.on('StasisStart', (stasisStartEvent: StasisStart, channel: Channel) => {
          this.stasisStart(stasisStartEvent, channel, ari);
        })
        ari.start('router-call-app')
          .then(() =>
            Logger.log(
              'Roteador de chamadas: router-call-app 🚀',
              'RouterCallAppService',
            ),
          );
      }
    );
    const command = 'ls -l /opt';
    exec(command, (error, stdout, stderr) => {
      if (error) {
        Logger.error(`exec error: ${error}`, 'RouterCallAppService.onApplicationBootstrap');
        return;
      }
      Logger.log(`stdout: ${stdout}`, 'RouterCallAppService.onApplicationBootstrap');
      Logger.error(`stderr: ${stderr}`, 'RouterCallAppService.onApplicationBootstrap');
    })
  }

  private stasisStart(stasisStartEvent: StasisStart, channel: Channel, ari: Client) {
    const company = stasisStartEvent.args[1];
    Logger.log(`Ligacao de ${channel.name} ${channel.caller.name} para ${channel.dialplan.exten} Empresa ${company}`, 'RouterCallAppService');
    if (channel.dialplan.exten === '123') {
      externalMediaCall(ari, channel);
      return;
    }
    if (company) this.simpleCallService.originateDialedChannel(ari, channel);
  }

}