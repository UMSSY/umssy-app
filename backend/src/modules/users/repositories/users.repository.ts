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

  findRecruitmentProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        headline: true,
        email: true,
        phone: true,
      },
    });
  }
  findCompany(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
  }
  assignCompany(userId: string, companyId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { companyId },
      select: { id: true },
    });
  }
}
