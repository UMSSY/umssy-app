import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findManyWithActiveRoles(ids: string[]) {
    return this.usersRepository.findManyWithActiveRoles(ids);
  }
}