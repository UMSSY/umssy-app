import { Injectable } from '@nestjs/common';

import { UsersService } from '../../users/services/users.service.js';
import { ApplicationsService } from '../../applications/services/applications.service.js';

import { CHAT_APPLICATION_CONTEXT_TYPE } from '../constants/chat-role-policy.constants.js';
import { ChatRoleNotAllowedException } from '../exceptions/chat.exception.js';
import type { ChatCommunicationAuthorization } from '../types/chat-communication-authorization.types.js';
import type { ChatCommunicationContext } from '../types/chat-communication-context.types.js';

const STUDENT_ROLES = new Set(['estudiante', 'titulado']);

@Injectable()
export class ChatRolePolicyService {
  constructor(
    private readonly usersService: UsersService,
    private readonly applicationsService: ApplicationsService,
  ) {}

  async assertCanCommunicate(
    userId: string,
    contactId: string,
    context?: ChatCommunicationContext,
  ): Promise<ChatCommunicationAuthorization> {
    const ids = [userId.trim().toLowerCase(), contactId.trim().toLowerCase()];

    if (ids[0] === ids[1]) {
      return this.deny();
    }

    const users = await this.usersService.findManyWithActiveRoles(ids);

    if (users.length !== 2 || users.some((user) => !user.isActive)) {
      return this.deny();
    }

    const firstUser = users.find((u) => u.id === ids[0]) ?? users[0];
    const secondUser = users.find((u) => u.id === ids[1]) ?? users[1];

    const firstRoles = firstUser.roles.map(({ role }) =>
      role.name.trim().toLowerCase(),
    );
    const secondRoles = secondUser.roles.map(({ role }) =>
      role.name.trim().toLowerCase(),
    );

    const isFirstStudent =
      firstRoles.length > 0 &&
      firstRoles.every((name) => STUDENT_ROLES.has(name));
    const isSecondStudent =
      secondRoles.length > 0 &&
      secondRoles.every((name) => STUDENT_ROLES.has(name));
    const isFirstCompany =
      firstRoles.length > 0 && firstRoles.every((name) => name === 'empresa');
    const isSecondCompany =
      secondRoles.length > 0 && secondRoles.every((name) => name === 'empresa');

    const hasStudentAndCompany =
      (isFirstStudent && isSecondCompany) || (isFirstCompany && isSecondStudent);

    if (context?.contextType === CHAT_APPLICATION_CONTEXT_TYPE) {
      if (!hasStudentAndCompany || !context.contextId) {
        return this.deny();
      }

      const student = isFirstStudent ? firstUser : secondUser;
      const companyUser = isFirstCompany ? firstUser : secondUser;

      if (!companyUser.companyId) {
        return this.deny();
      }

      const application =
        await this.applicationsService.validateApplicationForChat(
          context.contextId,
          student.id,
          companyUser.companyId,
        );

      if (!application.isValid) {
        return this.deny();
      }

      return { hasValidatedApplication: true };
    }

    if (isFirstStudent && isSecondStudent) {
      return { hasValidatedApplication: false };
    }

    return this.deny();
  }

  private deny(): never {
    throw new ChatRoleNotAllowedException();
  }
}