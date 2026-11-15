import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { APPROVED_GRADUATE_CAREER_SELECT } from '../constants/approved-graduate-career-select.constants.js';
import type { ApprovedGraduateCareerRecord } from '../types/approved-graduate-career-record.types.js';

@Injectable()
export class ApprovedGraduateCareersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserIds(userIds: string[]): Promise<ApprovedGraduateCareerRecord[]> {
    return this.prisma.accessRequest.findMany({
      where: { approvedUserId: { in: userIds } },
      select: APPROVED_GRADUATE_CAREER_SELECT,
    });
  }
}
