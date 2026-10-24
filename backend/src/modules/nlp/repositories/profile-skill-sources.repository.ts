import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';
import type { NlpTextSource } from '../types/nlp-text-source.type.js';

// Title and description are joined as separate sentences so a mention never spans both.
const joinText = (title: string, description: string | null) =>
  [title, description].filter((part) => Boolean(part?.trim())).join('.\n');

// Company and institution names are not read: "Java Soft S.R.L." is not evidence of Java.
@Injectable()
export class ProfileSkillSourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async userExists(userId: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { id: userId } })) > 0;
  }

  async findTextSources(userId: string): Promise<NlpTextSource[]> {
    const [workExperiences, educations] = await Promise.all([
      this.prisma.workExperience.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
        select: { id: true, position: true, description: true },
      }),
      this.prisma.education.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
        select: { id: true, degree: true, description: true },
      }),
    ]);

    return [
      ...workExperiences.map((record): NlpTextSource => ({
        id: record.id,
        type: 'work-experience',
        text: joinText(record.position, record.description),
      })),
      ...educations.map((record): NlpTextSource => ({
        id: record.id,
        type: 'education',
        text: joinText(record.degree, record.description),
      })),
    ];
  }

  findCatalog(): Promise<NlpCatalogSkill[]> {
    return this.prisma.skill.findMany({
      where: { isCustom: false },
      select: { id: true, name: true, areaId: true },
    });
  }
}
