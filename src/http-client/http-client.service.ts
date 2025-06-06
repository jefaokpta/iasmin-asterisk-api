import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Company } from '../companies/company';
import { SecurityService } from '../security/security.service';
import { User } from '../peer/user';
import * as https from 'https';

@Injectable()
export class HttpClientService {
  constructor(
    private readonly configService: ConfigService,
    private readonly securityService: SecurityService,
  ) {}

  private readonly BACKEND_API = this.configService.get('IASMIN_BACKEND_API');
  private readonly HTTP_REQUEST_TIMEOUT = 60_000; // Timeout para a resposta completa
  private readonly HTTP_CONNECTION_TIMEOUT = 10_000; // Timeout para a conexão inicial (10 segundos)

  private readonly logger = new Logger(HttpClientService.name);

  async getCompanies(): Promise<Company[]> {
    try {
      const response = await axios.get(`${this.BACKEND_API}/companies`, {
        httpsAgent: new https.Agent({ timeout: this.HTTP_CONNECTION_TIMEOUT }),
        timeout: this.HTTP_REQUEST_TIMEOUT,
        headers: {
          Authorization: `Bearer ${this.securityService.generateToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao obter empresas: ${error}`);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await axios.get(`${this.BACKEND_API}/users`, {
        httpsAgent: new https.Agent({ timeout: this.HTTP_CONNECTION_TIMEOUT }),
        timeout: this.HTTP_REQUEST_TIMEOUT,
        headers: {
          Authorization: `Bearer ${this.securityService.generateToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao obter usuários: ${error}`);
      throw error;
    }
  }
}
