/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 11/19/24
 */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CdrService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private readonly log = new Logger(CdrService.name);
  private readonly HTTP_REQUEST_TIMEOUT = 4000;

  cdrCreated(cdr: any) {
    //todo: converter audio pra mp3
    if (!cdr.company) return
    this.log.log(cdr)
    this.sendCdrToBackend(cdr)
  }

  private sendCdrToBackend(cdr: any) {
    firstValueFrom(this.httpService.post(`${this.configService.get('IASMIN_BACKEND_API')}/cdr`, cdr, {
      timeout: this.HTTP_REQUEST_TIMEOUT,
    })).catch((e) => {
        this.log.error(e.message, 'CdrService');
      })
  }
}