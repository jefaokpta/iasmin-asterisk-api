import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly configService: ConfigService) {}

  uploadAudio(audio: Express.Multer.File, id: string) {
    try {
      const newName = this.renameAudio(id);
      const tempPath = join(this.configService.get('AUDIO_RECORD')!, 'mp3s', newName);
      writeFileSync(tempPath, audio.buffer);
      this.logger.debug(`Arquivo ${newName} salvo com sucesso!`);
      return newName;
    } catch (error) {
      this.logger.error(`Erro ao salvar arquivo: ${error}`);
      throw new HttpException('Erro ao salvar arquivo de áudio', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private renameAudio(id: string) {
    const timestamp = Date.now();
    return `upload-${timestamp}-${id}.mp3`;
  }
}
