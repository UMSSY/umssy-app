import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CAREER_SELECT } from '../constants/survey.constants.js';
import type { CareerSortOrder } from '../types/career-sort-order.type.js';
import type { CareerRecord } from '../types/survey-record.type.js';

@Injectable()
export class CareersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(sortOrder: CareerSortOrder = 'asc'): Promise<CareerRecord[]> {
    return this.prisma.career.findMany({
      select: CAREER_SELECT,
      orderBy: { title: sortOrder },
    });
  }

  async exists(careerId: string): Promise<boolean> {
    const career = await this.prisma.career.findUnique({
      where: { id: careerId },
      select: { id: true },
    });
    return career !== null;
  }
}
