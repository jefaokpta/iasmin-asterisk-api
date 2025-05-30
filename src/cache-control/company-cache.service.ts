import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Company } from '../companies/models/company';

@Injectable()
export class CompanyCacheService {
  constructor(
    @Inject('CACHE_MANAGER')
    private readonly cacheManager: Cache,
  ) {}

  private readonly keyPrefix = 'company-';

  loadCompanies(companies: Company[]) {
    companies.forEach((company) => this.setCompanyPhone(company));
  }

  async getCompanyPhone(controlNumber: string): Promise<string | undefined> {
    const phone = await this.cacheManager.get<string>(this.keyPrefix + controlNumber);
    if (phone) return phone;
    return undefined;
  }

  changeCompanyPhone(company: Company) {
    this.setCompanyPhone(company);
  }

  private setCompanyPhone(company: Company) {
    this.cacheManager.set(this.keyPrefix + company.controlNumber, company.phone.toString());
  }
}
