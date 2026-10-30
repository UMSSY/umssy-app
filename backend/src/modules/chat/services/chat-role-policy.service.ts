
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

const ALLOWED_ROLES = new Set(['estudiante', 'titulado']);

@Injectable()
export class ChatRolePolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanCommunicate(
    userId: string,
    contactId: string,
  ): Promise<void> {
    const ids = [
      userId.trim().toLowerCase(),
      contactId.trim().toLowerCase(),
    ];

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        isActive: true,
        roles: {
          where: { deletedAt: null },
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });

    const allowed =
      users.length === 2 &&
      ids.every((id) =>
        users.some(
          (user) =>
            user.id.toLowerCase() === id &&
            user.isActive &&
            user.roles.length > 0 &&
            user.roles.every(({ role }) =>
              ALLOWED_ROLES.has(role.name.trim().toLowerCase()),
            ),
        ),
      );

    if (!allowed) {
      throw new ForbiddenException(
        'El chat privado solo está permitido entre estudiantes y titulados.',
      );
    }
  }
}
