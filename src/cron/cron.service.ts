import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { threadId } from 'node:worker_threads';
import { AntiInvasionService } from '../ami/services/anti-invasion.service';

@Injectable()
export class CronService {
  constructor(private readonly antiInvasionService: AntiInvasionService) {}

  // @Cron(CronExpression.EVERY_SECOND)
  // eventLoopHealthCheck() {
  //   Logger.log(`Event loop is healthy THREAD ${threadId}`, 'CronService.eventLoopHealthCheck');
  // }

  @Cron(CronExpression.EVERY_5_MINUTES)
  writeBlockedInvadersFile() {
    this.antiInvasionService.writeBlockedInvadersFile();
  }

}
