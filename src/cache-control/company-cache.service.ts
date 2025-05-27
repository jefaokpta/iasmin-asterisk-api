import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Company } from '../companies/models/company';

@Injectable()
export class CompanyCacheService {
  constructor(
    @Inject('CACHE_MANAGER')
    private readonly cacheManager: Cache,
  ) {}

  loadCompanies(companies: Company[]) {
    companies.forEach(c => this.cacheManager.set(c.controlNumber.toString(), c.phone.toString()));
  }

  async getCompanyPhone(controlNumber: string): Promise<string | undefined> {
    const n = await this.cacheManager.get<string>(controlNumber);
    if (n) return n;
    return undefined;
  }

  changeCompanyPhone(company: Company) {
    this.cacheManager.set(company.controlNumber.toString(), company.phone.toString());
  }
}
