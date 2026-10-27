import { Injectable } from '@nestjs/common';
import { CertificationsRepository } from '../../certifications/repositories/certifications.repository.js';
import { RadarEvidenceSourcesRepository } from '../../radar-integration/radar-evidence-sources.repository.js';
import { ProfileRepository } from '../../profile/repositories/profile.repository.js';
import { WorkExperienceRepository } from '../../work-experience/repositories/work-experience.repository.js';
import { EducationsRepository } from '../../educations/repositories/educations.repository.js';
import { SkillRepository } from '../../skills/repositories/skill.repository.js';
import type { NlpCatalogSkill } from '../types/nlp-catalog-skill.type.js';
import type { NlpTextSource } from '../types/nlp-text-source.type.js';

@Injectable()
export class ProfileSkillSourcesRepository {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly workExperienceRepository: WorkExperienceRepository,
    private readonly educationsRepository: EducationsRepository,
    private readonly skillRepository: SkillRepository,
    private readonly certificationsRepository: CertificationsRepository,
    private readonly radarEvidenceSources: RadarEvidenceSourcesRepository,
  ) {}

  userExists(userId: string): Promise<boolean> {
    return this.profileRepository.userExists(userId);
  }

  async findTextSources(userId: string): Promise<NlpTextSource[]> {
    const [workExperiences, educations, certifications, cvTexts] = await Promise.all([
      this.workExperienceRepository.findTextSources(userId),
      this.educationsRepository.findTextSources(userId),
      this.certificationsRepository.findManyByUserId(userId),
      this.radarEvidenceSources.findCurrentCvText(userId),
    ]);

    return [
      ...certifications.map((c):NlpTextSource => ({id:c.id,type:'certification',text:[c.name,c.issuingOrganization].join('. ')})),
      ...cvTexts,
      ...workExperiences,
      ...educations,
    ];
  }

  findCatalog(): Promise<NlpCatalogSkill[]> {
    return this.skillRepository.findNlpCatalog();
  }
}
