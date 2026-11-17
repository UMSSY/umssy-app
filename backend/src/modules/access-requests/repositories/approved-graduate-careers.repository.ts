import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { APPROVED_GRADUATE_CAREER_SELECT } from '../constants/approved-graduate-career-select.constants.js';
import { APPROVED_GRADUATE_USER_SELECT } from '../constants/approved-graduate-user-select.constants.js';
import type { ApprovedGraduateCareerRecord } from '../types/approved-graduate-career-record.types.js';
import type { ApprovedGraduateCohortFilter } from '../types/approved-graduate-cohort-filter.types.js';

@Injectable()
export class ApprovedGraduateCareersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserIds(userIds: string[]): Promise<ApprovedGraduateCareerRecord[]> {
    return this.prisma.accessRequest.findMany({
      where: { approvedUserId: { in: userIds } },
      select: APPROVED_GRADUATE_CAREER_SELECT,
    });
  }

  async findApprovedUserIds({
    careerId,
    graduationYear,
  }: ApprovedGraduateCohortFilter): Promise<string[]> {
    const records = await this.prisma.accessRequest.findMany({
      where: {
        approvedUserId: { not: null },
        ...(careerId ? { careerId } : {}),
        ...(graduationYear ? { graduationYear } : {}),
      },
      select: APPROVED_GRADUATE_USER_SELECT,
    });
    return records.flatMap((record) =>
      record.approvedUserId ? [record.approvedUserId] : [],
    );
  }
}
