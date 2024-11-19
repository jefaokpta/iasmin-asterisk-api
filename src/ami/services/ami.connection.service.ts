/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/18/24
 */

// @ts-ignore
import * as Manager from 'asterisk-manager';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CdrService } from './cdr.service';

@Injectable()
export class AmiConnectionService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly cdrService: CdrService
  ) {}
  private ami: Manager;

  onApplicationBootstrap() {
    this.ami = new Manager(
      this.configService.get('AMI_PORT'),
      this.configService.get('AMI_HOST'),
      this.configService.get('AMI_USER'),
      this.configService.get('AMI_PASS'),
      true
    );

    this.ami.keepConnected();

    Logger.log('AMI Conectado 🚀', 'AmiConnectionService');

    this.ami.on('cdr', (cdr: any) => this.cdrService.cdrCreated(cdr));
  }
}