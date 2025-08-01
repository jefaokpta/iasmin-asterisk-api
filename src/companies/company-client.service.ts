/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 01/08/2025
 */
import { ConfigService } from '@nestjs/config';
import { SecurityService } from '../security/security.service';
import { Injectable, Logger } from '@nestjs/common';
import { Company } from './company';
import axios from 'axios';
import https from 'https';

@Injectable()
export class CompanyClientService {
  private readonly BACKEND_API = this.configService.get('IASMIN_BACKEND_API');
  private readonly HTTP_REQUEST_TIMEOUT = 60_000; // Timeout para a resposta completa
  private readonly HTTP_CONNECTION_TIMEOUT = 10_000; // Timeout para a conexão inicial (10 segundos)
  private readonly logger = new Logger(CompanyClientService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly securityService: SecurityService,
  ) {}

  async findCompanyByPhone(extension: string): Promise<Company> {
    try {
      const response = await axios.get(`${this.BACKEND_API}/companies/phones/${extension}`, this.createHttpConfig());
      return response.data;
    } catch (err) {
      this.logger.error(`Erro ao obter empresa pelo numero de telefone: ${err}`);
      throw err;
    }
  }

  async findByControlNumber(controlNumber: string): Promise<Company> {
    try {
      const response = await axios.get(`${this.BACKEND_API}/companies/control-numbers/${controlNumber}`, this.createHttpConfig());
      return response.data;
    } catch (err) {
      this.logger.error(`Erro ao obter empresa pelo CN: ${err}`);
      throw err;
    }
  }

  private createHttpConfig() {
    return {
      httpsAgent: new https.Agent({ timeout: this.HTTP_CONNECTION_TIMEOUT }),
      timeout: this.HTTP_REQUEST_TIMEOUT,
      headers: {
        Authorization: `Bearer ${this.securityService.generateToken()}`,
      },
    };
  }

}