import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class UploadService {

  constructor(private readonly configService: ConfigService) {}

  uploadAudio(audio: Express.Multer.File, id: string) {
    const tempPath = join(this.configService.get('AUDIO_RECORD')!, this.renameAudio(id));
    writeFile(tempPath, audio.buffer, (err) => {
      if (err) Logger.error(`Erro ao salvar arquivo: ${err}`);
      else Logger.log('Arquivo salvo com sucesso!');
    });
  }

  private renameAudio(id: string) {
    const timestamp = Date.now();
    return `${timestamp}-${id}.mp3`;
  }
  
}
