/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/18/24
 */

// @ts-ignore
import * as Manager from 'asterisk-manager';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AmiConnectionService implements OnApplicationBootstrap {
  constructor(private readonly configService: ConfigService) {}
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

    this.ami.on('managerevent', (evt: any) => {
      console.log(evt);
    })
  }

  getAmi() {
    return this.ami;
  }
}