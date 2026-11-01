import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  MANUAL_SKILL_SOURCE,
  NLP_SKILL_SOURCE,
} from '../constants/experience-skills.constants.js';
import { appendEvidenceRef } from '../utils/append-evidence-ref.js';
import { buildExperienceRef } from '../utils/build-experience-ref.js';
import { readEvidenceRefs } from '../utils/read-evidence-refs.js';

@Injectable()
export class ExperienceSkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async belongsToUser(experienceId: string, userId: string): Promise<boolean> {
    const experience = await this.prisma.workExperience.findFirst({
      where: { id: experienceId, userId },
      select: { id: true },
    });
    return experience !== null;
  }

  async replaceDetected(
    userId: string,
    experienceId: string,
    skillIds: string[],
  ): Promise<void> {
    const ref = buildExperienceRef(experienceId);

    await this.prisma.$transaction(async (tx) => {
      const linked = await tx.userSkill.findMany({
        where: { userId, evidenceRefs: { array_contains: [ref] } },
        select: { id: true, skillId: true, source: true, evidenceRefs: true },
      });

      for (const row of linked) {
        if (skillIds.includes(row.skillId)) continue;
        const refs = readEvidenceRefs(row.evidenceRefs).filter(
          (item) => item !== ref,
        );
        if (refs.length === 0 && row.source === NLP_SKILL_SOURCE) {
          await tx.userSkill.delete({ where: { id: row.id } });
        } else {
          await tx.userSkill.update({
            where: { id: row.id },
            data: { evidenceRefs: refs },
          });
        }
      }

      if (skillIds.length === 0) return;

      const existing = await tx.userSkill.findMany({
        where: { userId, skillId: { in: skillIds } },
        select: { id: true, skillId: true, source: true, evidenceRefs: true },
      });
      const existingBySkill = new Map(existing.map((row) => [row.skillId, row]));

      for (const skillId of skillIds) {
        const row = existingBySkill.get(skillId);
        if (!row) {
          await tx.userSkill.create({
            data: {
              userId,
              skillId,
              source: MANUAL_SKILL_SOURCE,
              evidenceRefs: [ref],
            },
          });
          continue;
        }
        const needsPromotion = row.source !== MANUAL_SKILL_SOURCE;
        const needsRef = !readEvidenceRefs(row.evidenceRefs).includes(ref);
        if (!needsPromotion && !needsRef) continue;
        await tx.userSkill.update({
          where: { id: row.id },
          data: {
            ...(needsPromotion ? { source: MANUAL_SKILL_SOURCE } : {}),
            ...(needsRef
              ? { evidenceRefs: appendEvidenceRef(row.evidenceRefs, ref) }
              : {}),
          },
        });
      }
    });
  }
}
