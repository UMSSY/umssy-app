import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import { RadarEvidenceSourcesService } from './radar-evidence-sources.service.js';

@Injectable()
export class RadarPublicationEvidenceService {
  constructor(
    private readonly skills: SkillAnalysisService,
    private readonly cv: RadarEvidenceSourcesService,
    private readonly workExperience: WorkExperienceSourcesService,
    private readonly educations: EducationSourcesService,
    private readonly certifications: CertificationSourcesService,
  ) {}

  countPendingPublicationSkills(userId: string): Promise<number> {
    return this.skills.countPendingPublicationSkills(userId);
  }

  read(userId: string, context: TransactionContext) {
    return Promise.all([
      this.skills.findApprovedPublicationSkills(userId, context),
      this.cv.findPublicationCvStates(userId, context),
      this.workExperience.findPublicationEvidenceIds(userId, context),
      this.educations.findPublicationEvidenceIds(userId, context),
      this.certifications.findPublicationEvidenceIds(userId, context),
    ]);
  }
}
