import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository.js';

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

  findUserRecipientById(userId: string) {
    return this.usersRepository.findUserRecipientById(userId);
  }

  countAudienceUsers(filter: {
    roles: readonly string[];
    careerId?: string;
    graduationYear?: number;
    excludedUserIds?: string[];
  }): Promise<number> {
    return this.usersRepository.countAudienceUsers(filter);
  }

  findAudienceRecipients(filter: {
    roles: readonly string[];
    careerId?: string;
    graduationYear?: number;
    excludedUserIds?: string[];
  }): Promise<
    Array<{ id: string; email: string; firstName: string; lastName: string }>
  > {
    return this.usersRepository.findAudienceRecipients(filter);
  }
}
