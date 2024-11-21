/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/19/24
 */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Cdr } from '../models/cdr';
import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

@Injectable()
export class CdrService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private readonly log = new Logger(CdrService.name);
  private readonly HTTP_REQUEST_TIMEOUT = 4000;
  private readonly IASMIN_BACKEND_API = this.configService.get('IASMIN_BACKEND_API');
  private readonly AUDIO_RECORD = this.configService.get('AUDIO_RECORD');

  async cdrCreated(cdr: Cdr) {
    if (!cdr.company) return;
    // await this.convertAudioToMp3(cdr);
    this.sendCdrToBackend(cdr);
  }

  private async convertAudioToMp3(cdr: Cdr) {
    this.log.log('Convertendo arquivo de audio para mp3', cdr.callRecord);
    const audioFile = `${this.AUDIO_RECORD}/${cdr.callRecord}.wav`;
    const command = `ffmpeg -i ${audioFile} -vn -acodec libmp3lame -ab 128k ${audioFile.replace('.wav', '.mp3')}`;
    execSync(command);
    this.log.log('Arquivo de audio convertido para mp3', cdr.callRecord);
    this.deleteWavFile(audioFile);
  }

  private deleteWavFile(audioFile: string) {
    fs.unlink(audioFile, (err) => {
      if (err) this.log.error(err.message, 'CdrService.deleteWavFile');
    });
  }

  private sendCdrToBackend(cdr: Cdr) {
    this.log.log(`Enviando CDR para o backend`, CdrService.name);
    firstValueFrom(
      this.httpService.post(`${this.IASMIN_BACKEND_API}/cdr`, cdr, {
        timeout: this.HTTP_REQUEST_TIMEOUT,
      }),
    )
      .then((response) =>
        this.log.log('CDR enviada com sucesso', response.data),
      )
      .catch((e) => this.log.error(e.response.data.message, 'CdrService'));
  }
}