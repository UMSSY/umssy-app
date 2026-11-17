import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { EXCLUDED_SKILL_STATUSES } from '../constants/event-affinity.constants.js';
import type { AffinitySignals } from '../types/affinity-signals.types.js';
import { readRadarScores } from '../utils/read-radar-scores.js';

@Injectable()
export class EventAffinitySignalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<AffinitySignals> {
    const [user, userSkills, educations, snapshot] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { headline: true, aboutMe: true },
      }),
      this.prisma.userSkill.findMany({
        where: {
          userId,
          verificationStatus: { notIn: EXCLUDED_SKILL_STATUSES },
        },
        select: { skill: { select: { name: true } } },
      }),
      this.prisma.education.findMany({
        where: { userId },
        select: { degree: true },
      }),
      this.prisma.radarScoreSnapshot.findFirst({
        where: { userId },
        orderBy: { version: 'desc' },
        select: { scores: true },
      }),
    ]);

    return {
      skills: userSkills.map(({ skill }) => skill.name),
      radarScores: readRadarScores(snapshot?.scores),
      careers: educations
        .map(({ degree }) => degree.trim())
        .filter((degree) => degree.length > 0),
      interests: [user?.headline, user?.aboutMe]
        .filter((text): text is string => Boolean(text?.trim()))
        .join(' '),
    };
  }
}
