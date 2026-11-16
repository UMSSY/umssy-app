import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import { RadarEvidenceSourcesService } from '../../radar-integration/services/radar-evidence-sources.service.js';
import type { SkillSourceSnapshot } from '../types/skill-source-snapshot.type.js';

@Injectable()
export class SkillEvidenceSourcesService {
  constructor(
    private readonly cvs: CvSourcesService,
    private readonly certifications: CertificationSourcesService,
    private readonly educations: EducationSourcesService,
    private readonly work: WorkExperienceSourcesService,
    private readonly documents: RadarEvidenceSourcesService,
  ) {}
  async load(
    userId: string,
    context?: TransactionContext,
  ): Promise<SkillSourceSnapshot> {
    const [cvs, certs, education, work, documents] = await Promise.all([
      this.cvs.findEvidenceRows(userId, context),
      this.certifications.findEvidenceRows(userId, context),
      this.educations.findPublicationEvidenceIds(userId, context),
      this.work.findPublicationEvidenceIds(userId, context),
      this.documents.findApprovedDocumentSkills(userId, context),
    ]);
    const snapshot: SkillSourceSnapshot = {
      live: new Set([`presentation:${userId}`]),
      written: new Set([`presentation:${userId}`]),
      approved: new Map(),
    };
    for (const row of cvs)
      if (row.hasDocument) snapshot.live.add(`cv:${row.id}`);
    for (const row of certs) {
      const key = `certification:${row.id}`;
      if (row.hasDocument) snapshot.live.add(key);
      if (!row.hasDocument) snapshot.written.add(key);
    }
    for (const [type, rows] of [
      ['education', education],
      ['work-experience', work],
    ] as const) {
      for (const row of rows) {
        const key = `${type}:${row.id}`;
        snapshot.live.add(key);
        snapshot.written.add(key);
      }
    }
    for (const row of documents)
      snapshot.approved.set(
        `${row.sourceType}:${row.sourceId}`,
        new Set(row.skills.map((skill) => skill.id)),
      );
    return snapshot;
  }
}
