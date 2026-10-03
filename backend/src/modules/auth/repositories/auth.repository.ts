import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmailWithRoles(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });
  }
}