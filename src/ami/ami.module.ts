import { Module } from '@nestjs/common';
import { AmiService } from './ami.service';
import { AmiController } from './ami.controller';
import { AmiConnectionService } from './services/ami.connection.service';
import { CdrService } from './services/cdr.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [AmiController],
  providers: [
    AmiService,
    AmiConnectionService,
    CdrService,
  ],
})
export class AmiModule {}
