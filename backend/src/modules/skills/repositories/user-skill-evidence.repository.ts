import { Injectable } from '@nestjs/common';
import { parseEvidenceRef } from '../utils/parse-evidence-refs.js';
import { evidenceItems } from '../utils/evidence-items.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { USER_SKILL_SOURCES } from '../constants/user-skill.constants.js';
import { buildExperienceRef } from '../utils/build-experience-ref.js';

const userSkillEvidenceSelect = {
  id: true,
  skillId: true,
  source: true,
  evidenceRefs: true,
} as const;

@Injectable()
export class UserSkillEvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replaceDetected(
    userId: string,
    experienceId: string,
    skillIds: string[],
  ): Promise<void> {
    const legacyRef = buildExperienceRef(experienceId);
    const ref = { type: 'work-experience', id: experienceId };

    await this.prisma.$transaction(async (tx) => {
      const linked = await tx.userSkill.findMany({
        where: {
          userId,
          OR: [
            { evidenceRefs: { array_contains: [legacyRef] } },
            { evidenceRefs: { array_contains: [ref] } },
          ],
        },
        select: userSkillEvidenceSelect,
      });

      for (const row of linked) {
        if (skillIds.includes(row.skillId)) continue;
        const refs = evidenceItems(row.evidenceRefs).filter((item) => {
          const parsed = parseEvidenceRef(item);
          return (
            parsed?.type !== 'work-experience' || parsed.id !== experienceId
          );
        });
        if (refs.length === 0 && row.source === USER_SKILL_SOURCES.nlp) {
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
        select: userSkillEvidenceSelect,
      });
      const existingBySkill = new Map(
        existing.map((row) => [row.skillId, row]),
      );

      for (const skillId of new Set(skillIds)) {
        const row = existingBySkill.get(skillId);
        if (!row) {
          await tx.userSkill.create({
            data: {
              userId,
              skillId,
              source: USER_SKILL_SOURCES.nlp,
              evidenceRefs: [ref],
            },
          });
          continue;
        }
        const refs = evidenceItems(row.evidenceRefs);
        if (
          refs.some((item) => {
            const parsed = parseEvidenceRef(item);
            return (
              parsed?.type === 'work-experience' && parsed.id === experienceId
            );
          })
        ) {
          continue;
        }
        await tx.userSkill.update({
          where: { id: row.id },
          data: { evidenceRefs: [...refs, ref] },
        });
      }
    });
  }
}
