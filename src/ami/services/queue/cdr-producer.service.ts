/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/27/24
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cdr } from '../../models/cdr';

@Injectable()
export class CdrProducerService {
  constructor(@InjectQueue('convert-audio-queue') private readonly audioConversionQueue: Queue) {}

  async addCdrToQueue(cdr: Cdr) {
    Logger.log(`Adicionando CDR ${cdr.uniqueId} para conversão de audio`, 'CdrProducerService.addCdrToQueue');
    await this.audioConversionQueue.add('convert-audio-job', cdr);
  }
}