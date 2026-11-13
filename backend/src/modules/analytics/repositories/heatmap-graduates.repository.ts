import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { EMPLOYMENT_STATUS_QUESTION, MONTHLY_SALARY_QUESTION } from '../constants/heatmap.constants.js';
import type {
  HeatmapCareer,
  HeatmapGraduateRecord,
  HeatmapGraduateSource,
} from '../types/heatmap-graduate.types.js';

@Injectable()
export class HeatmapGraduatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCareers(): Promise<HeatmapCareer[]> {
    return this.prisma.career.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'desc' },
    });
  }

  findEmploymentResponses(
    source: HeatmapGraduateSource,
  ): Promise<HeatmapGraduateRecord[]> {
    return this.prisma.surveyResponse.findMany({
      where: {
        submittedAt:
          source.from || source.to
            ? { gte: source.from, lte: source.to }
            : undefined,
        answers: {
          some: { question: { statement: EMPLOYMENT_STATUS_QUESTION } },
        },
        respondent: {
          isActive: true,
           approvedAccessRequest:
             source.careerId || source.promotion
               ? {
                   is: {
                     ...(source.careerId ? { careerId: source.careerId } : {}),
                     ...(source.promotion ? { graduationYear: source.promotion } : {}),
                   },
                 }
               : { isNot: null },
        },
      },
      select: {
        respondentId: true,
        submittedAt: true,
        answers: {
          where: {
            question: {
              statement: {
                in: [EMPLOYMENT_STATUS_QUESTION, MONTHLY_SALARY_QUESTION],
              },
            },
          },
          select: {
            question: { select: { statement: true } },
            option: { select: { label: true } },
          },
        },
        respondent: {
          select: {
            approvedAccessRequest: { select: { careerId: true, graduationYear: true } },
            userSkills: {
              select: {
                source: true,
                skill: { select: { id: true, name: true } },
              },
            },
            workExperiences: { select: { startDate: true, endDate: true } },
          },
        },
      },
    });
  }
}
