import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service.js';
import { CHAT_ALLOWED_ROLES } from '../constants/chat-role-policy.constants.js';
import { ChatRoleNotAllowedException } from '../exceptions/index.js';

@Injectable()
export class ChatRolePolicyService {
  constructor(private readonly usersService: UsersService) {}

  async assertCanCommunicate(
    userId: string,
    contactId: string,
  ): Promise<void> {
    const ids = [
      userId.trim().toLowerCase(),
      contactId.trim().toLowerCase(),
    ];

    const users = await this.usersService.findManyWithActiveRoles(ids);

    const allowed =
      users.length === 2 &&
      ids.every((id) =>
        users.some(
          (user) =>
            user.id.toLowerCase() === id &&
            user.isActive &&
            hasOnlyChatAllowedRoles(
              user.roles.map(({ role }) => role.name),
            ),
        ),
      );

    if (!allowed) {
      throw new ChatRoleNotAllowedException();
    }
  }
}