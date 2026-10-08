import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { SkillResponse } from '../types/skills.types.js';

// Tope de resultados para no sobrecargar el popup de búsqueda del frontend
export const SKILLS_SEARCH_LIMIT = 20;

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async searchSkills(searchText?: string): Promise<SkillResponse[]> {
    if (!searchText) {
      return [];
    }

    return this.prisma.skill.findMany({
      where: {
        isCustom: false,
        name: { contains: searchText, mode: 'insensitive' },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: SKILLS_SEARCH_LIMIT,
    });
  }

  async findExistingSkillIds(skillIds: string[]): Promise<string[]> {
    const skills = await this.prisma.skill.findMany({
      where: {
        id: {
          in: skillIds,
        },
      },
      select: {
        id: true,
      },
    });

    return skills.map((skill) => skill.id);
  }
}
