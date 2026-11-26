import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RECRUITER_ROLE } from '../constants/recruiter-role.constants.js';
import type { CompanyRecruiter } from '../types/company-recruiter.types.js';
import { USER_CONTACT_SELECT } from '../constants/user-contact-select.constants.js';
import type { ActiveUsersByRolesFilter } from '../types/active-users-by-roles-filter.types.js';
import type { UserContact } from '../types/user-contact.types.js';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findNamesByIds(ids: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true },
    });
  }
  findManyWithActiveRoles(ids: string[]) {
    return this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        isActive: true,
        companyId: true,
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
  findActiveRecruitersByCompany(
    companyId: string,
  ): Promise<CompanyRecruiter[]> {
    return this.prisma.user.findMany({
      where: {
        companyId,
        isActive: true,
        roles: {
          some: {
            deletedAt: null,
            startAt: { lte: new Date() },
            role: { name: RECRUITER_ROLE },
          },
        },
      },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
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

  findContactById(userId: string): Promise<UserContact | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_CONTACT_SELECT,
    });
  }

  findActiveContactsByRoles({
    roles,
    userIds,
  }: ActiveUsersByRolesFilter): Promise<UserContact[]> {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        roles: { some: { deletedAt: null, role: { name: { in: [...roles] } } } },
        ...(userIds ? { id: { in: [...userIds] } } : {}),
      },
      select: USER_CONTACT_SELECT,
      orderBy: { id: 'asc' },
    });
  }
}
