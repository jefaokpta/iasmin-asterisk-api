import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { AmiModule } from '../ami/ami.module';

@Module({
  imports: [AmiModule],
  providers: [CronService],
})
export class CronModule {}
