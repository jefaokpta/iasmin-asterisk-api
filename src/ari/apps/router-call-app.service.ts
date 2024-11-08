/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/8/24
 */

import { Client, connect } from 'ari-client';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RouterCallAppService implements OnApplicationBootstrap {
  constructor(private readonly configService: ConfigService) {
  }

  onApplicationBootstrap() {
    connect(
      this.configService.get('AST_HOST')!,
      this.configService.get('AST_USER')!,
      this.configService.get('AST_PASS')!,
      this.clientLoaded,
    );
  }

  clientLoaded(error: Error, client: Client) {
    if (error) {
      throw error;
    }
    console.log('Connected to ARI!!!!!!!!!!!!!!!!!');

    client.channels.list(function (err, channels) {
      if (err) {
        throw err;
      }

      channels.forEach(function (channel) {
        console.log(channel.name);
      });
    });
  }
}