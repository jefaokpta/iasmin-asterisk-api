import { Injectable } from '@nestjs/common';
import { UserDto } from '../peer/dto/user.dto';

@Injectable()
export class UserCacheService {
  private readonly userCache = new Map<string, UserDto[]>();

  constructor() {}

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
      this.userCache.set(key, groupUsers);
    });
  }

  getUsersByControlNumber(controlNumber: string): UserDto[] {
    const users = this.userCache.get(controlNumber);
    if (users) return users;
    return [];
  }
}
