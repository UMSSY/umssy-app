import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { USER_SKILL_SOURCES } from '../constants/user-skill.constants.js';
import { buildExperienceRef } from '../utils/build-experience-ref.js';

const userSkillEvidenceSelect = {
  id: true,
  skillId: true,
  source: true,
  evidenceRefs: true,
} as const;

function isExperienceReference(value: unknown, experienceId: string): boolean {
  if (typeof value === 'string') {
    return value === buildExperienceRef(experienceId);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const ref = value as { type?: unknown; id?: unknown };
  return ref.type === 'work-experience' && ref.id === experienceId;
}

function evidenceItems(value: unknown): Prisma.InputJsonArray {
  return Array.isArray(value) ? (value as Prisma.InputJsonArray) : [];
}

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
        const refs = evidenceItems(row.evidenceRefs).filter(
          (item) => !isExperienceReference(item, experienceId),
        );
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
        if (refs.some((item) => isExperienceReference(item, experienceId))) {
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
