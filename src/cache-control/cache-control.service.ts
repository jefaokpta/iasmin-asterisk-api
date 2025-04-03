import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Company } from '../models/company';

@Injectable()
export class CacheControlService {
  constructor(
    @Inject('CACHE_MANAGER')
    private readonly cacheManager: Cache,
  ) {}

  loadCompanies(companies: Company[]) {
    companies.forEach((c) =>
      this.cacheManager.set(c.controlNumber.toString(), c.phone),
    );
  }

  async getCompanyPhone(controlNumber: string): Promise<number | undefined> {
    const n = await this.cacheManager.get<number>(controlNumber);
    if (n) return n;
    return undefined;
  }
}
