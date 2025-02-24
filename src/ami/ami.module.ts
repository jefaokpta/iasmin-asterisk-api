import { Module } from '@nestjs/common';
import { AmiConnectionService } from './services/ami.connection.service';
import { CdrService } from './services/cdr.service';
import { HttpModule } from '@nestjs/axios';
import { AntiInvasionService } from './services/anti-invasion.service';
import { AmiService } from './services/ami.service';
@Module({
  imports: [HttpModule],
  providers: [
    AmiConnectionService,
    CdrService,
    AntiInvasionService,
    AmiService
  ],
  exports: [AmiService]
})
export class AmiModule {}
