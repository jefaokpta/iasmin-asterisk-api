import { Injectable } from '@nestjs/common';
import { Company } from '../companies/company';

@Injectable()
export class CompanyCacheService {
  private readonly companyCache = new Map<string, Company>();

  constructor() {}

  loadCompanies(companies: Company[]) {
    companies.forEach((company) => this.setCompanyPhone(company));
  }

  getCompanyPhone(controlNumber: string): string | undefined {
    return this.companyCache.get(controlNumber)?.phone;
  }

  changeCompanyPhone(company: Company) {
    this.setCompanyPhone(company);
  }

  findCompanyByPhone(phone: string): string | undefined {
    const company = Array.from(this.companyCache.values()).find((company) => company.phone === phone);
    return company?.controlNumber;
  }

  findAttendants(controlNumber: string): string[] {
    const company = this.companyCache.get(controlNumber);
    if (!company) return [];
    return company.attendantCallUsers;
  }

  private setCompanyPhone(company: Company) {
    this.companyCache.set(company.controlNumber.toString(), company);
  }
}
