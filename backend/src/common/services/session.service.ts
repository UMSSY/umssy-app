import { Injectable } from '@nestjs/common';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';
import { UserInactiveException } from '../exceptions/user-inactive.exception.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../types/authenticated-user.types.js';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuthenticatedUser(id: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        isActive: true,
        roles: {
          where: { deletedAt: null, startAt: { lte: new Date() } },
          select: { role: { select: { name: true } } },
        },
      },
    });
    if (!user) throw new UnauthorizedSessionException();
    if (user.isActive === false) throw new UserInactiveException();
    if (user.roles.length === 0) throw new UnauthorizedSessionException();

    return {
      id: user.id,
      email: user.email,
      roles: [...new Set(user.roles.map(({ role }) => role.name))],
    };
  }
}
