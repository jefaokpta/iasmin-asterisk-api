import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Company } from '../models/company';

@Injectable()
export class HttpClientService {
  constructor(private readonly configService: ConfigService) {}

  private readonly BACKEND_API = this.configService.get('IASMIN_BACKEND_API');
  private readonly HTTP_REQUEST_TIMEOUT = 8000;
  private readonly logger = new Logger(HttpClientService.name);

  async getCompanies(): Promise<Company[] | undefined> {
    try {
      const response = await axios.get(`${this.BACKEND_API}/companies`, {
        timeout: this.HTTP_REQUEST_TIMEOUT,
      });
      console.log(
        `GET ${this.BACKEND_API}/companies - ${response.status} - ${response.statusText}`,
      ); //TODO: remove
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao obter companies: ${error}`);
    }
  }
}
