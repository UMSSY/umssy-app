import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CAREER_SELECT } from '../constants/survey.constants.js';
import type { CareerRecord } from '../types/survey-record.type.js';

@Injectable()
export class CareersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<CareerRecord[]> {
    return this.prisma.career.findMany({
      select: CAREER_SELECT,
      orderBy: { title: 'asc' },
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
