import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class UploadService {

  constructor(private readonly configService: ConfigService) {}

  uploadAudio(audio: Express.Multer.File, id: string) {
    try {
      const newName = this.renameAudio(id);
      const tempPath = join(this.configService.get('AUDIO_RECORD')!, 'mp3s', newName);
      writeFileSync(tempPath, audio.buffer);
      Logger.log('Arquivo salvo com sucesso!');
      return newName;
    } catch (error) {
      Logger.error(`Erro ao salvar arquivo: ${error}`);
      throw new HttpException('Erro ao salvar arquivo de áudio', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private renameAudio(id: string) {
    const timestamp = Date.now();
    return `${timestamp}-${id}.mp3`;
  }
  
}
