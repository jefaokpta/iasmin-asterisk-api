import { Module } from '@nestjs/common';
import { HttpClientService } from './http-client.service';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [SecurityModule],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class HttpClientModule {}
