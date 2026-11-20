import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { RadarEvidenceSourcesService } from '../../radar-integration/services/radar-evidence-sources.service.js';
@Injectable()
export class SkillEvidenceSourcesService {
  constructor(
    private readonly cvs: CvSourcesService,
    private readonly certifications: CertificationSourcesService,
    private readonly educations: EducationSourcesService,
    private readonly experiences: WorkExperienceSourcesService,
    private readonly radar: RadarEvidenceSourcesService,
  ) {}
  async load(userId: string, context?: TransactionContext) {
    const [cvs, certificates, educations, experiences, documents] =
      await Promise.all([
        this.cvs.findVerificationSources(userId, context),
        this.certifications.findVerificationSources(userId, context),
        this.educations.findVerificationSources(userId, context),
        this.experiences.findVerificationSources(userId, context),
        context ? this.radar.findApprovedDocuments(userId, context) : [],
      ]);
    const live = new Set([
      `presentation:${userId}`,
      ...cvs.map((row) => `cv:${row.id}`),
      ...certificates
        .filter((row) => row.hasDocument)
        .map((row) => `certification:${row.id}`),
      ...educations.map((row) => `education:${row.id}`),
      ...experiences.map((row) => `work-experience:${row.id}`),
    ]);
    const written = new Set([
      `presentation:${userId}`,
      ...certificates
        .filter((row) => !row.hasDocument)
        .map((row) => `certification:${row.id}`),
      ...educations.map((row) => `education:${row.id}`),
      ...experiences.map((row) => `work-experience:${row.id}`),
    ]);
    const approved = new Set(
      documents.flatMap((doc) =>
        Array.isArray(doc.skills)
          ? doc.skills.flatMap((skill) =>
              skill &&
              typeof skill === 'object' &&
              !Array.isArray(skill) &&
              typeof skill.id === 'string'
                ? [`${doc.sourceType}:${doc.sourceId}:${skill.id}`]
                : [],
            )
          : [],
      ),
    );
    return { live, written, approved };
  }
}
