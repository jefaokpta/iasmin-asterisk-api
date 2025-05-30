/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 4/3/25
 */
import { Module } from '@nestjs/common';
import { CompanyCacheService } from './company-cache.service';
import { UserCacheService } from './user-cache.service';

@Module({
  providers: [CompanyCacheService, UserCacheService],
  exports: [CompanyCacheService, UserCacheService],
})
export class CacheControlModule {}