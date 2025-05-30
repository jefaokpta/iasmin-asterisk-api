import { Body, Controller, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './company';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  changeCompanyPhone(@Body() company: Company) {
    this.companiesService.changeCompanyPhone(company);
  }
}
