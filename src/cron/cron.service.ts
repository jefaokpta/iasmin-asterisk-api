import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AmiService } from '../ami/services/ami.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly amiService: AmiService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  writeBlockedInvadersFile() {
    this.amiService.writeBlockedInvadersFile();
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  resetBlockedInvaders() {
    this.amiService.resetBlockedInvaders();
    this.cleanAudiosAfter10Days();
  }

  private cleanAudiosAfter10Days() {
    try {
      const audiosPath = this.configService.get('AUDIO_RECORD');
      const daysAgo = 10;
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - daysAgo);

      const files = fs.readdirSync(audiosPath);
      let deletedCount = 0;
      if (!audiosPath || !fs.existsSync(audiosPath)) {
        this.logger.warn(`Diretório de áudios não encontrado: ${audiosPath}`);
        return;
      }

      for (const file of files) {
        const filePath = path.join(audiosPath, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            // Usa a data de criação (birthtime) ou modificação (mtime) se birthtime não estiver disponível
            const creationDate = stats.birthtime || stats.mtime;
            if (creationDate < tenDaysAgo) {
              fs.unlinkSync(filePath);
              deletedCount++;
            }
          }
        } catch (fileError) {
          this.logger.error(`Erro ao processar arquivo ${file}:`, fileError);
        }
      }

      this.logger.log(`👍 Limpeza de áudios concluída. ${deletedCount} arquivos deletados.`);
    } catch (error) {
      this.logger.error('Erro durante a limpeza de áudios:', error);
    }
  }
}