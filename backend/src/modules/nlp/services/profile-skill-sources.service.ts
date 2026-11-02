import { Injectable } from '@nestjs/common';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { ProfileService } from '../../profile/services/profile.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import type { NlpTextSource } from '../types/nlp-text-source.type.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';

const joinText = (title: string, description: string | null) =>
  [title, description].filter((part) => Boolean(part?.trim())).join('.\n');

@Injectable()
export class ProfileSkillSourcesService {
  constructor(
    private readonly educations: EducationSourcesService,
    private readonly workExperience: WorkExperienceSourcesService,
    private readonly profile: ProfileService,
    private readonly skills: SkillAnalysisService,
  ) {}

  ensureProfileExists(userId: string): Promise<void> {
    return this.profile.ensureProfileExists(userId);
  }

  async findTextSources(userId: string): Promise<NlpTextSource[]> {
    const [workExperiences, educations] = await Promise.all([
      this.workExperience.findAnalysisSources(userId),
      this.educations.findAnalysisSources(userId),
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
    return this.skills.findCatalog();
  }
}
