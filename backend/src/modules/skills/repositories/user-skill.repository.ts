import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { USER_SKILL_SOURCES } from '../constants/user-skill.constants.js';
import type { UserSkillRecord } from '../types/user-skill-record.type.js';
import { planManualSkillChanges } from '../utils/plan-manual-skill-changes.js';
import { skillSelect } from './skill.repository.js';

const userSkillSelect = { skill: { select: skillSelect } } as const;
const sourceRowSelect = {
  id: true,
  skillId: true,
  source: true,
  evidenceRefs: true,
} as const;

@Injectable()
export class UserSkillRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAllByUserId(userId: string): Promise<UserSkillRecord[]> {
    return this.listSkills(userId);
  }

  findByUserId(userId: string): Promise<UserSkillRecord[]> {
    return this.listSkills(userId, USER_SKILL_SOURCES.manual);
  }

  private listSkills(userId: string, source?: string): Promise<UserSkillRecord[]> {
    return this.prisma.userSkill.findMany({
      where: { userId, ...(source && {source}) },
      orderBy: { skill: { name: 'asc' } },
      select: userSkillSelect,
    });
  }

  async replaceForUser(
    userId: string,
    skillIds: string[],
  ): Promise<UserSkillRecord[]> {
    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.userSkill.findMany({
        where: { userId },
        select: sourceRowSelect,
      });
      const changes = planManualSkillChanges(rows, skillIds);

      if (changes.deleteIds.length > 0) {
        await tx.userSkill.deleteMany({
          where: { userId, id: { in: changes.deleteIds } },
        });
      }
      if (changes.toDetectedIds.length > 0) {
        await tx.userSkill.updateMany({
          where: { userId, id: { in: changes.toDetectedIds } },
          data: { source: USER_SKILL_SOURCES.nlp },
        });
      }
      if (changes.toManualIds.length > 0) {
        await tx.userSkill.updateMany({
          where: { userId, id: { in: changes.toManualIds } },
          data: { source: USER_SKILL_SOURCES.manual },
        });
      }
      if (changes.createSkillIds.length > 0) {
        await tx.userSkill.createMany({
          data: changes.createSkillIds.map((skillId) => ({
            userId,
            skillId,
            source: USER_SKILL_SOURCES.manual,
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.findByUserId(userId);
  }

  async addSkillsForUser(
    userId: string,
    skillIds: string[],
  ): Promise<UserSkillRecord[]> {
    if (skillIds.length === 0) {
      return this.findByUserId(userId);
    }

    const existingRows = await this.prisma.userSkill.findMany({
      where: { userId },
      select: { skillId: true },
    });
    const existingSkillIds = new Set(existingRows.map((row) => row.skillId));
    const newSkillIds = skillIds.filter((id) => !existingSkillIds.has(id));

    if (newSkillIds.length > 0) {
      await this.prisma.userSkill.createMany({
        data: newSkillIds.map((skillId) => ({
          userId,
          skillId,
          source: USER_SKILL_SOURCES.manual,
        })),
        skipDuplicates: true,
      });
    }

    return this.findByUserId(userId);
  }
}
