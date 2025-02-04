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
import { exec } from 'node:child_process';

@Injectable()
export class CdrService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private readonly HTTP_REQUEST_TIMEOUT = 8000;
  private readonly IASMIN_BACKEND_API = this.configService.get('IASMIN_BACKEND_API');
  private readonly AUDIO_RECORD = this.configService.get('AUDIO_RECORD');

  async cdrCreated(cdr: Cdr) {
    if (!cdr.company) return;
    if (cdr.billableSeconds > 0) {
      this.convertAudioToMp3({ ...cdr, callRecord: this.createRecordFileName(cdr) });
      return
    }
    this.sendCdrToBackend(cdr);
  }

  private convertAudioToMp3(cdr: Cdr) {
    Logger.log(`Convertendo arquivo de audio para mp3 ${cdr.callRecord}`, 'CdrService.convertAudioToMp3');
    const audioFilePath = `${this.AUDIO_RECORD}/${cdr.uniqueId.replace('.', '-')}.sln`;
    const mp3FilePath = `${this.AUDIO_RECORD}/mp3s/${cdr.callRecord}`;
    const command = `ffmpeg -i ${audioFilePath} -vn -acodec libmp3lame -ab 128k ${mp3FilePath}`;
    exec(command, (err) => {
      if (err) Logger.error(err.message, 'CdrService.convertAudioToMp3');
      Logger.log(`Arquivo convertido com sucesso ${cdr.callRecord}`, 'CdrService.convertAudioToMp3');
      this.sendCdrToBackend(cdr);
      this.deleteWavFile(audioFilePath);
    })
  }

  private deleteWavFile(audioFile: string) {
    fs.unlink(audioFile, (err) => {
      if (err) Logger.error(err.message, 'CdrService.deleteWavFile');
    });
  }

  private sendCdrToBackend(cdr: Cdr) {
    Logger.log(`Enviando CDR para o backend`, 'CdrService.sendCdrToBackend');
    firstValueFrom(
      this.httpService.post(`${this.IASMIN_BACKEND_API}/cdr`, cdr, {
        timeout: this.HTTP_REQUEST_TIMEOUT,
      }),
    ).then((response) =>
        Logger.log(`CDR enviada com sucesso! ${response.data}`, 'CdrService.sendCdrToBackend'),
      )
      .catch((e) => {
        Logger.error(e.message, 'CdrService.sendCdrToBackend');
        if (e.response?.data){
          Logger.error(e.response.data.message, 'CdrService.sendCdrToBackend');
        }
      });
  }

  private createRecordFileName(cdr: Cdr): string {
    const date = cdr.startTime.split(' ')[0].replace(/-/g, '');
    const time = cdr.startTime.split(' ')[1].replace(/:/g, '');
    return `${date}_${time}_${cdr.src}_${cdr.destination}_${cdr.uniqueId.replace('.', '-')}.mp3`;
  }

}