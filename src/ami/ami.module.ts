import { Module } from '@nestjs/common';
import { AmiService } from './ami.service';
import { AmiController } from './ami.controller';
import { AmiConnectionService } from './services/ami.connection.service';

@Module({
  controllers: [AmiController],
  providers: [AmiService, AmiConnectionService],
})
export class AmiModule {}
