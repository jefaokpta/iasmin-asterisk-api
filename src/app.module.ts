import { Module } from '@nestjs/common';
import { AriModule } from './ari/ari.module';
import { ConfigModule } from '@nestjs/config';
import { AmiModule } from './ami/ami.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronModule } from './cron/cron.module';
import { UploadModule } from './upload/upload.module';
import { PeerModule } from './peer/peer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AriModule,
    AmiModule,
    CronModule,
    UploadModule,
    PeerModule,
  ],
})
export class AppModule {}
