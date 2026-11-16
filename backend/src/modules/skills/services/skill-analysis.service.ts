import { SkillEvidenceSourcesService } from './skill-evidence-sources.service.js';
import { skillSourceRefs } from '../utils/skill-source-refs.js';
import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import type { SkillAnalysisCatalogResponse } from '../responses/skill-analysis-catalog.response.js';
import type { DetectedSkillPayload } from '../types/detected-skill-payload.type.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';

@Injectable()
export class SkillAnalysisService {
  constructor(
    private readonly repository: SkillAnalysisRepository,
    private readonly sources: SkillEvidenceSourcesService,
  ) {}

  hasProfileSkills(userId: string): Promise<boolean> {
    return this.repository.hasProfileSkills(userId);
  }

  listReviewQueue() {
    return this.repository.listReviewQueue();
  }

  skillForDecision(skillId: string, context: TransactionContext) {
    return this.repository.skillForDecision(skillId, context);
  }

  changeSkillDecision(
    skillId: string,
    action: string,
    context: TransactionContext,
  ) {
    return this.repository.changeSkillDecision(skillId, action, context);
  }

  findCatalog(): Promise<SkillAnalysisCatalogResponse[]> {
    return this.repository.findCatalog();
  }

  async countPendingPublicationSkills(userId: string): Promise<number> {
    const [rows, snapshot] = await Promise.all([
      this.repository.findProfileSkillRows(userId),
      this.sources.load(userId),
    ]);
    return rows.filter(
      (row) =>
        row.verificationStatus === 'pending' &&
        (row.source === 'manual' ||
          skillSourceRefs(row.evidenceRefs).some((ref) =>
            snapshot.live.has(`${ref.type}:${ref.id}`),
          )),
    ).length;
  }

  findProfileSkillRows(userId: string): Promise<ProfileSkillRowResponse[]> {
    return this.repository.findProfileSkillRows(userId);
  }

  findApprovedPublicationSkills(userId: string, context: TransactionContext) {
    return this.repository.findApprovedPublicationSkills(userId, context);
  }

  async reconcileDetected(
    userId: string,
    detected: readonly DetectedSkillPayload[],
    context: TransactionContext,
  ): Promise<boolean> {
    const rows = await this.repository.findProfileSkillRows(userId, context);

    const plan = planSkillReconciliation(rows, detected);

    await this.repository.applyReconciliation(userId, plan, context);

    const snapshot = await this.sources.load(userId, context);
    const current = await this.repository.findProfileSkillRows(userId, context);
    const updates = current.flatMap((row) => {
      const refs = skillSourceRefs(row.evidenceRefs);
      const written =
        row.source === 'manual' ||
        refs.some((ref) => snapshot.written.has(`${ref.type}:${ref.id}`));
      const eligible =
        written ||
        (row.source === 'nlp' &&
          refs.some((ref) =>
            snapshot.approved.get(`${ref.type}:${ref.id}`)?.has(row.skillId),
          ));
      if (
        eligible &&
        (row.verificationStatus === 'pending' ||
          (written && ['revoked', 'rejected'].includes(row.verificationStatus)))
      )
        return [{ id: row.id, approved: true, expectedStatus:row.verificationStatus, expectedAuto:row.radarAutoVerified ?? false }];
      if (
        !eligible &&
        row.verificationStatus === 'approved' &&
        row.radarAutoVerified
      )
        return [{ id: row.id, approved: false, expectedStatus:row.verificationStatus, expectedAuto:row.radarAutoVerified ?? false }];
      return [];
    });
    const decisions = updates.length
      ? await this.repository.applyVerificationDecisions(
          userId,
          updates,
          context,
        )
      : 0;

    return (
      decisions > 0 ||
      plan.creates.length + plan.updates.length + plan.deleteIds.length > 0
    );
  }

  findApprovedRecruitmentReferences(userId: string, ids: string[]) {
    return this.repository.findApprovedRecruitmentReferences(userId, ids);
  }
}
