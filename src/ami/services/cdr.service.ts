/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/19/24
 */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Cdr } from '../models/cdr';
import { execSync } from 'node:child_process';
import { UtilService } from '../../utils/util.service';

@Injectable()
export class CdrService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilService,
  ) {}

  private readonly logger = new Logger(CdrService.name);
  private readonly HTTP_REQUEST_TIMEOUT = 30000;
  private readonly IASMIN_BACKEND_API = this.configService.get('IASMIN_BACKEND_API');
  private readonly AUDIO_RECORD = this.configService.get('AUDIO_RECORD');
  private readonly AUDIO_RECORD_MP3 = `${this.AUDIO_RECORD}/mp3s`;

  async cdrCreated(cdr: Cdr) {
    if (cdr.billableSeconds > 0) {
      const cdrUpdated = { ...cdr, callRecord: this.createRecordFileName(cdr) };
      await this.convertAudioToMp3(cdrUpdated);
      this.sendCdrToBackend(cdrUpdated);
      return;
    }
    if (!cdr.peer && cdr.userfield === 'INBOUND') {
      this.utilsService.defineAttendants(cdr.company).forEach((user) => this.sendCdrToBackend({ ...cdr, peer: user.id.toString() }));
      return;
    }
    this.sendCdrToBackend(cdr);
  }

  private async convertAudioToMp3(cdr: Cdr) {
    this.logger.log(`Convertendo arquivo de audio para mp3 ${cdr.callRecord}`);
    const audioFilePath = `${this.AUDIO_RECORD}/${cdr.uniqueId.replace('.', '-')}-mixed.sln`;
    const mp3FilePath = `${this.AUDIO_RECORD_MP3}/${cdr.callRecord}`;
    const command = `ffmpeg -i ${audioFilePath} -vn -acodec libmp3lame -ab 128k ${mp3FilePath}`;
    try {
      execSync(command, { stdio: 'ignore' });
    } catch (error) {
      this.logger.error(error.message);
    }
  }

  private sendCdrToBackend(cdr: Cdr) {
    this.logger.log(`Enviando CDR para o backend`);
    firstValueFrom(
      this.httpService.post(`${this.IASMIN_BACKEND_API}/cdr`, cdr, {
        timeout: this.HTTP_REQUEST_TIMEOUT,
      }),
    )
      .then((response) => this.logger.log(`CDR enviada com sucesso! ${cdr.channel} ${response.data}`))
      .catch((e) => {
        this.logger.error(e.message);
        if (e.response?.data) {
          this.logger.error(e.response.data.message);
        }
      });
  }

  private createRecordFileName(cdr: Cdr): string {
    const date = cdr.startTime.split(' ')[0].replace(/-/g, '');
    const time = cdr.startTime.split(' ')[1].replace(/:/g, '');
    return `${date}_${time}_${cdr.src}_${cdr.destination}_${cdr.uniqueId.replace('.', '-')}.mp3`;
  }
}
