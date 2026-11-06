import { Injectable } from '@nestjs/common';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';
import { UserInactiveException } from '../exceptions/user-inactive.exception.js';
import { SessionRepository } from '../repositories/session.repository.js';
import type { AuthenticatedUser } from '../types/authenticated-user.types.js';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async getAuthenticatedUser(id: string): Promise<AuthenticatedUser> {
    const user = await this.sessionRepository.findUserById(id);
    if (!user) throw new UnauthorizedSessionException();
    if (user.isActive === false) throw new UserInactiveException();
    if (user.roles.length === 0) throw new UnauthorizedSessionException();

    return {
      id: user.id,
      email: user.email,
      roles: [...new Set(user.roles.map((item) => item.role.name))],
    };
  }
}
