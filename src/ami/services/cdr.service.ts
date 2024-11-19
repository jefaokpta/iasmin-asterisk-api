/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/19/24
 */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Cdr } from '../models/cdr';

@Injectable()
export class CdrService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private readonly log = new Logger(CdrService.name);
  private readonly HTTP_REQUEST_TIMEOUT = 4000;
  private readonly IASMIN_BACKEND_API = this.configService.get('IASMIN_BACKEND_API');

  cdrCreated(cdr: Cdr) {
    //todo: converter audio pra mp3
    if (!cdr.company) return
    this.sendCdrToBackend(cdr)
  }



  private sendCdrToBackend(cdr: Cdr) {
    firstValueFrom(this.httpService.post(`${this.IASMIN_BACKEND_API}/cdr`, cdr, {
      timeout: this.HTTP_REQUEST_TIMEOUT,
    }))
      .then((response) => this.log.log('CDR enviada com sucesso', response.data))
      .catch((e) => this.log.error(e.response.data.message, 'CdrService'))
  }
}