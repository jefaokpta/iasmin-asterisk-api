import { Injectable } from '@nestjs/common';
import { CompanyCacheService } from '../cache-control/company-cache.service';
import { Company } from './models/company';

@Injectable()
export class CompaniesService {
  constructor(private readonly cacheControlService: CompanyCacheService) {}

  changeCompanyPhone(company: Company) {
    this.cacheControlService.changeCompanyPhone(company);
  }
}
