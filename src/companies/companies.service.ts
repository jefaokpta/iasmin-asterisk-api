import { Injectable } from '@nestjs/common';
import { CacheControlService } from '../cache-control/cache-control.service';
import { Company } from './models/company';

@Injectable()
export class CompaniesService {
  constructor(private readonly cacheControlService: CacheControlService) {}

  changeCompanyPhone(company: Company) {
    this.cacheControlService.changeCompanyPhone(company);
  }
}
