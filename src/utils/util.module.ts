/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 6/3/25
 */

import { Module } from '@nestjs/common';
import { CacheControlModule } from '../cache-control/cache-control.module';
import { UtilService } from './util.service';

@Module({
  imports: [CacheControlModule],
  providers: [UtilService],
  exports: [UtilService],
})
export class UtilModule {}