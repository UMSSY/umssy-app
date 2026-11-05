
import { Injectable } from '@nestjs/common';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { ProfileService } from '../../profile/services/profile.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { CertificationsRepository } from '../../certifications/repositories/certifications.repository.js';
import { RadarEvidenceSourcesRepository } from '../../radar-integration/radar-evidence-sources.repository.js';
import type { NlpTextSource } from '../types/nlp-text-source.type.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';

const joinText = (title: string, description: string | null) =>
  [title, description]
    .filter((part) => Boolean(part?.trim()))
    .join('.\n');

@Injectable()
export class ProfileSkillSourcesService {
  constructor(
    private readonly educations: EducationSourcesService,
    private readonly workExperience: WorkExperienceSourcesService,
    private readonly profile: ProfileService,
    private readonly skills: SkillAnalysisService,
    private readonly certifications: CertificationsRepository,
    private readonly radarEvidence: RadarEvidenceSourcesRepository,
  ) {}

  ensureProfileExists(userId: string): Promise<void> {
    return this.profile.ensureProfileExists(userId);
  }

  async findTextSources(userId: string): Promise<NlpTextSource[]> {
    const [workExperiences, educations, certifications, cvTexts] =
      await Promise.all([
        this.workExperience.findAnalysisSources(userId),
        this.educations.findAnalysisSources(userId),
        this.certifications.findManyByUserId(userId),
        this.radarEvidence.findCurrentCvText(userId),
      ]);

    return [
      ...workExperiences.map(
        (record): NlpTextSource => ({
          id: record.id,
          type: 'work-experience',
          text: joinText(record.position, record.description),
        }),
      ),
      ...educations.map(
        (record): NlpTextSource => ({
          id: record.id,
          type: 'education',
          text: joinText(record.degree, record.description),
        }),
      ),
      ...certifications.map(
        (record): NlpTextSource => ({
          id: record.id,
          type: 'certification',
          text: [record.name, record.issuingOrganization]
            .filter(Boolean)
            .join('. '),
        }),
      ),
      ...cvTexts,
    ];
  }

  findCatalog(): Promise<NlpCatalogSkill[]> {
    return this.skills.findCatalog();
  }
}
