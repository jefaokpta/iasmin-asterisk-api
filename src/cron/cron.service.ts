import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmiService } from '../ami/services/ami.service';

@Injectable()
export class CronService {
  constructor(private readonly amiService: AmiService) {}

  // @Cron(CronExpression.EVERY_SECOND)
  // eventLoopHealthCheck() {
  //   Logger.log(`Event loop is healthy THREAD ${threadId}`, 'CronService.eventLoopHealthCheck');
  // }

  @Cron(CronExpression.EVERY_5_MINUTES)
  writeBlockedInvadersFile() {
    this.amiService.writeBlockedInvadersFile();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  resetBlockedInvaders() {
    this.amiService.resetBlockedInvaders();
  }

}
