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
}
