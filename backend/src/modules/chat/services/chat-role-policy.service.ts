import { Injectable } from '@nestjs/common';

import { UsersService } from '../../users/services/users.service.js';

import { ChatRoleNotAllowedException } from '../exceptions/chat.exceptions.js';

const STUDENT_ROLES = new Set(['estudiante', 'titulado']);

@Injectable()
export class ChatRolePolicyService {
  constructor(private readonly usersService: UsersService) {}

  async assertCanCommunicate(userId: string, contactId: string): Promise<void> {
    const ids = [userId.trim().toLowerCase(), contactId.trim().toLowerCase()];

    if (ids[0] === ids[1]) {
      return this.deny();
    }

    const users = await this.usersService.findManyWithActiveRoles(ids);

    if (users.length !== 2 || users.some((user) => !user.isActive)) {
      return this.deny();
    }

    const roles = users.map((user) =>
      user.roles.map(({ role }) => role.name.trim().toLowerCase()),
    );

    const areStudents = roles.map(
      (names) =>
        names.length > 0 && names.every((name) => STUDENT_ROLES.has(name)),
    );

    if (areStudents[0] && areStudents[1]) {
      return;
    }

    return this.deny();
  }

  private deny(): never {
    throw new ChatRoleNotAllowedException();
  }
}
