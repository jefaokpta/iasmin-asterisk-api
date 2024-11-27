import { Module } from '@nestjs/common';
import { AmiService } from './ami.service';
import { AmiConnectionService } from './services/ami.connection.service';
import { CdrService } from './services/cdr.service';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { CdrConsumerService } from './services/queue/cdr-consumer.service';
import { CdrProducerService } from './services/queue/cdr-producer.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'convert-audio-queue',
    }),
    HttpModule
  ],
  providers: [
    AmiService,
    AmiConnectionService,
    CdrService,
    CdrProducerService,
    CdrConsumerService,
  ],
})
export class AmiModule {}
