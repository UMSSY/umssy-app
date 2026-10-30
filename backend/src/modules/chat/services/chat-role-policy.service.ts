import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  InactiveUserException,
  UserNotFoundException,
} from '../exceptions/index.js';

const ALLOWED_CHAT_ROLES: ReadonlySet<string> = new Set([
  'estudiante',
  'titulado',
]);

@Injectable()
export class ChatRolePolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanCommunicate(
    firstUserId: string,
    secondUserId: string,
  ): Promise<void> {
    const userIds = [
      ...new Set([
        firstUserId.trim().toLowerCase(),
        secondUserId.trim().toLowerCase(),
      ]),
    ];

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        isActive: true,
        roles: {
          where: {
            deletedAt: null,
          },
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const usersById = new Map(
      users.map((user) => [user.id.toLowerCase(), user]),
    );

    for (const userId of userIds) {
      const user = usersById.get(userId);

      if (!user) {
        throw new UserNotFoundException();
      }

      if (!user.isActive) {
        throw new InactiveUserException();
      }

    const roles = user.roles.map(({ role }) => role.name);

    if (
        roles.length === 0 ||
        roles.some((role) => !ALLOWED_CHAT_ROLES.has(role))
      ) {
        throw new ForbiddenException(
          'Durante este sprint, la comunicación del chat solo está permitida entre estudiantes y titulados.',
        );
      }
    }
  }
}
