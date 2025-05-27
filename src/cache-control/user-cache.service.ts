import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { UserDto } from '../peer/dto/user.dto';

@Injectable()
export class UserCacheService {
  constructor(
    @Inject('CACHE_MANAGER')
    private readonly cacheManager: Cache,
  ) {}

  loadUsers(users: UserDto[]) {
    const groupedUsers = users.reduce(
      (acc, user) => {
        const key = user.controlNumber.toString();
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(user);
        return acc;
      },
      {} as Record<string, UserDto[]>,
    );

    Object.entries(groupedUsers).forEach(([key, groupUsers]) => {
      this.cacheManager.set(key, groupUsers);
    });
  }

  async getUsersByControlNumber(controlNumber: string): Promise<UserDto[] | undefined> {
    const users = await this.cacheManager.get<UserDto[]>(controlNumber);
    if (users) return users;
    return undefined;
  }
}
