import { Injectable } from '@nestjs/common';
import { User } from '../peer/user';

@Injectable()
export class UserCacheService {
  private readonly userCache = new Map<string, User[]>();

  constructor() {}

  loadUsers(users: User[]) {
    const groupedUsers = users.reduce(
      (acc, user) => {
        const key = user.controlNumber;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(user);
        return acc;
      },
      {} as Record<string, User[]>,
    );

    Object.entries(groupedUsers).forEach(([key, groupUsers]) => {
      this.userCache.set(key, groupUsers);
    });
  }

  getUsersByControlNumber(controlNumber: string): User[] {
    const users = this.userCache.get(controlNumber);
    if (users) return users;
    return [];
  }
}
