import { Module } from '@nestjs/common';
import { CompanyClientService } from './company-client.service';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [SecurityModule],
  providers: [CompanyClientService],
  exports: [CompanyClientService],
})
export class CompaniesModule {}
