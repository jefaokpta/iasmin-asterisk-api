/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/18/24
 */

// @ts-expect-error - This is a workaround to avoid the error "Cannot find module 'asterisk-manager'".
import * as Manager from 'asterisk-manager';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CdrService } from './cdr.service';
import { Cdr } from '../models/cdr';
import { AntiInvasionService } from './anti-invasion.service';
import { Invader } from '../models/invader';

@Injectable()
export class AmiConnectionService implements OnApplicationBootstrap {
  constructor(
    private readonly configService: ConfigService,
    private readonly cdrService: CdrService,
    private readonly antiInvasionService: AntiInvasionService,
  ) {}

  private ami: Manager;

  onApplicationBootstrap() {
    this.ami = new Manager(
      this.configService.get('AMI_PORT'),
      this.configService.get('AMI_HOST'),
      this.configService.get('AMI_USER'),
      this.configService.get('AMI_PASS'),
      true,
    );

    this.ami.keepConnected();

    Logger.log('AMI Conectado 🚀', 'AmiConnectionService');

    this.ami.on('cdr', (cdr: any) => {
      if (cdr.destination == 's') return;
      if (cdr.destination.length < 8) {
        console.log(cdr); // TODO: depois dos testes return
        return;
      }
      this.cdrService.cdrCreated(new Cdr(cdr));
    });
    this.ami.on('invalidaccountid', (invalidAccountId: any) =>
      this.antiInvasionService.antiInvasion(new Invader(invalidAccountId)),
    );
  }

  pjsipReload() {
    try {
      this.ami.action({
        Action: 'Command',
        Command: 'pjsip reload',
      });
      Logger.log('PJSIP recarregado com sucesso', 'AmiConnectionService');
    } catch (error) {
      Logger.error('Erro ao recarregar PJSIP', error, 'AmiConnectionService');
      throw error;
    }
  }
}
