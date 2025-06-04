/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 6/3/25
 */
import { Injectable } from '@nestjs/common';
import { User } from '../peer/user';
import { UserCacheService } from '../cache-control/user-cache.service';
import { CompanyCacheService } from '../cache-control/company-cache.service';

@Injectable()
export class UtilService {
  constructor(
    private readonly companyCacheService: CompanyCacheService,
    private readonly userCacheService: UserCacheService,
  ) {}

  defineAttendants(controlNumber: string): User[] {
    const attendants = this.companyCacheService.findAttendants(controlNumber);
    if (attendants.length > 0) {
      return this.userCacheService
        .getUsersByControlNumber(controlNumber)
        .filter((user) => attendants.find((attendant) => attendant === user.id.toString()))
        .filter((user) => user.roles.length > 1);
    }
    return this.userCacheService.getUsersByControlNumber(controlNumber).filter((user) => user.roles.length > 1);
  }
}