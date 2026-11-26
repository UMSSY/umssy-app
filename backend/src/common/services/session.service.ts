import { Injectable } from '@nestjs/common';
import { PasswordChangedException } from '../exceptions/password-changed.exception.js';
import { SessionRevokedException } from '../exceptions/session-revoked.exception.js';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';
import { UserInactiveException } from '../exceptions/user-inactive.exception.js';
import { SessionRepository } from '../repositories/session.repository.js';
import type { AuthenticatedUser } from '../types/authenticated-user.types.js';

const SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PASSWORD_CHANGED_REASON = 'password_changed';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async assertSessionActive(sessionId: unknown): Promise<void> {
    if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) {
      throw new UnauthorizedSessionException();
    }
    const revoked = await this.sessionRepository.findRevokedSession(sessionId);
    if (!revoked) return;
    throw revoked.revokedReason === PASSWORD_CHANGED_REASON
      ? new PasswordChangedException()
      : new SessionRevokedException();
  }

  async getAuthenticatedUser(id: string): Promise<AuthenticatedUser> {
    const user = await this.sessionRepository.findUserById(id);
    if (!user) throw new UnauthorizedSessionException();
    if (user.isActive === false) throw new UserInactiveException();
    if (user.roles.length === 0) throw new UnauthorizedSessionException();

    return {
      id: user.id,
      email: user.email,
      company: user.company
        ? { id: user.company.id, name: user.company.title }
        : null,
      roles: [...new Set(user.roles.map((item) => item.role.name))],
    };
  }
}
