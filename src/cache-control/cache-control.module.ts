/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 4/3/25
 */
import { Module } from '@nestjs/common';
import { CacheControlService } from './cache-control.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
  providers: [CacheControlService],
  exports: [CacheControlService],
})
export class CacheControlModule {}