import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyWithActiveRoles(ids: string[]) {
    return this.prisma.user.findMany({
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
  }
}
