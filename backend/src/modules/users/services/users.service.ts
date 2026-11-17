import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository.js';
import type { ActiveUsersByRolesFilter } from '../types/active-users-by-roles-filter.types.js';
import type { UserContact } from '../types/user-contact.types.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findManyWithActiveRoles(ids: string[]) {
    return this.usersRepository.findManyWithActiveRoles(ids);
  }

  findRecruitmentProfile(userId: string) {
    return this.usersRepository.findRecruitmentProfile(userId);
  }
  findCompany(userId: string) {
    return this.usersRepository.findCompany(userId);
  }
  assignCompany(userId: string, companyId: string) {
    return this.usersRepository.assignCompany(userId, companyId);
  }
  findEmailById(userId: string): Promise<string | null> {
    return this.usersRepository.findEmailById(userId);
  }

  findContactById(userId: string): Promise<UserContact | null> {
    return this.usersRepository.findContactById(userId);
  }

  async findActiveContactsByRoles(
    filter: ActiveUsersByRolesFilter,
  ): Promise<UserContact[]> {
    if (filter.roles.length === 0 || filter.userIds?.length === 0) return [];
    return this.usersRepository.findActiveContactsByRoles(filter);
  }
}
