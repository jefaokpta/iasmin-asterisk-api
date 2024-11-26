import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { threadId } from 'node:worker_threads';

@Injectable()
export class CronService {

  @Cron(CronExpression.EVERY_SECOND)
  eventLoopHealthCheck() {
    Logger.log(`Event loop is healthy ${threadId}`, 'CronService.eventLoopHealthCheck');
  }
}
