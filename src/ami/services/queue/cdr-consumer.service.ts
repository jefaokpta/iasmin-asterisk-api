/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/27/24
 */

import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { threadId } from 'node:worker_threads';
import { exec, execSync } from 'node:child_process';
import { Cdr } from '../../models/cdr';
import { Job } from 'bull';

@Processor('convert-audio-queue')
export class CdrConsumerService {

  @Process('convert-audio-job')
  convertAudioJob(job: Job<Cdr>) {
    Logger.log(`Convertendo arquivo de audio para mp3 ${job.data.uniqueId} usando THREAD ${threadId}`, 'CdrConsumerService.convertAudioJob');
    exec('sleep 15', (err, stdout, stderr) => {
      if (err) Logger.error(err.message, 'CdrConsumerService.convertAudioJob');
      Logger.log(`TERMINADO mp3 ${job.data.callRecord} THREAD ${threadId}`, 'CdrConsumerService.convertAudioJob');
    })
  }

}