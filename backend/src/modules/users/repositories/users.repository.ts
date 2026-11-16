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
    async findEmailById(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  findUserRecipientById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  countAudienceUsers(filter: {
    roles: readonly string[];
    careerId?: string;
    graduationYear?: number;
    excludedUserIds?: string[];
  }): Promise<number> {
    return this.prisma.user.count({
      where: {
        isActive: true,
        roles: {
          some: { deletedAt: null, role: { name: { in: [...filter.roles] } } },
        },
        ...(filter.excludedUserIds && filter.excludedUserIds.length > 0
          ? { id: { notIn: filter.excludedUserIds } }
          : {}),
        ...(filter.careerId || filter.graduationYear
          ? {
              approvedAccessRequest: {
                is: {
                  ...(filter.careerId ? { careerId: filter.careerId } : {}),
                  ...(filter.graduationYear
                    ? { graduationYear: filter.graduationYear }
                    : {}),
                },
              },
            }
          : {}),
      },
    });
  }

  findAudienceRecipients(filter: {
    roles: readonly string[];
    careerId?: string;
    graduationYear?: number;
    excludedUserIds?: string[];
  }): Promise<
    Array<{ id: string; email: string; firstName: string; lastName: string }>
  > {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        roles: {
          some: { deletedAt: null, role: { name: { in: [...filter.roles] } } },
        },
        ...(filter.excludedUserIds && filter.excludedUserIds.length > 0
          ? { id: { notIn: filter.excludedUserIds } }
          : {}),
        ...(filter.careerId || filter.graduationYear
          ? {
              approvedAccessRequest: {
                is: {
                  ...(filter.careerId ? { careerId: filter.careerId } : {}),
                  ...(filter.graduationYear
                    ? { graduationYear: filter.graduationYear }
                    : {}),
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { id: 'asc' },
    });
  }
}