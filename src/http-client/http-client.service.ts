import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Company } from '../companies/models/company';
import { SecurityService } from '../security/security.service';

@Injectable()
export class HttpClientService {
  constructor(
    private readonly configService: ConfigService,
    private readonly securityService: SecurityService,
  ) {}

  private readonly BACKEND_API = this.configService.get('IASMIN_BACKEND_API');
  private readonly HTTP_REQUEST_TIMEOUT = 60_000;
  private readonly logger = new Logger(HttpClientService.name);

  async getCompanies(): Promise<Company[]> {
    try {
      const response = await axios.get(`${this.BACKEND_API}/companies`, {
        timeout: this.HTTP_REQUEST_TIMEOUT,
        headers: {
          Authorization: `Bearer ${this.securityService.generateToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao obter companies: ${error}`);
      throw error;
    }
  }
}
