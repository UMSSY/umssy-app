import { UsersService } from '../../users/services/users.service.js';
import { SkillEvidenceSourcesService } from './skill-evidence-sources.service.js';
import { parseEvidenceRefs } from '../utils/parse-evidence-refs.js';
import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import type { SkillAnalysisCatalogResponse } from '../responses/skill-analysis-catalog.response.js';
import type { DetectedSkillPayload } from '../types/detected-skill-payload.type.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';
import { toUserSkillSummary } from '../mappers/user-skill-summary.mapper.js';
import type { UserSkillSummaryResponse } from '../responses/user-skill-summary.response.js';
import { USER_SKILL_SOURCES } from '../constants/user-skill.constants.js';
import { isVisibleNlpSkill } from '../../nlp/utils/is-visible-nlp-skill.js';

@Injectable()
export class SkillAnalysisService {
  constructor(
    private readonly repository: SkillAnalysisRepository,
    private readonly sources: SkillEvidenceSourcesService,
    private readonly users: UsersService,
  ) {}

  async hasProfileSkills(userId: string): Promise<boolean> {
    const rows = await this.repository.findProfileSkillRows(userId);
    return rows.some(
      (row) =>
        row.source === USER_SKILL_SOURCES.manual ||
        (row.source === USER_SKILL_SOURCES.nlp &&
          isVisibleNlpSkill(row.skill.name, row.evidenceRefs)),
    );
  }

  async listReviewQueue() {
    const rows = await this.repository.listReviewQueue();
    const owners = await this.users.findNamesByIds([
      ...new Set(rows.map((row) => row.userId)),
    ]);
    const names = new Map(owners.map((owner) => [owner.id, owner]));
    return rows.map((row) => ({
      ...row,
      user: names.get(row.userId) ?? {
        firstName: 'Usuario',
        lastName: 'no disponible',
      },
    }));
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
    const [rows, sources] = await Promise.all([
      this.repository.findProfileSkillRows(userId),
      this.sources.load(userId),
    ]);
    return rows.filter(
      (row) =>
        row.verificationStatus === 'pending' &&
        (row.source === 'manual' ||
          parseEvidenceRefs(row.evidenceRefs).some((ref) =>
            sources.live.has(`${ref.type}:${ref.id}`),
          )),
    ).length;
  }

  findProfileSkillRows(
    userId: string,
    context?: TransactionContext,
  ): Promise<ProfileSkillRowResponse[]> {
    return context
      ? this.repository.findProfileSkillRows(userId, context)
      : this.repository.findProfileSkillRows(userId);
  }

  findApprovedPublicationSkills(userId: string, context: TransactionContext) {
    return this.repository.findApprovedPublicationSkills(userId, context);
  }

  async reconcileDetected(
    userId: string,
    detected: readonly DetectedSkillPayload[],
    context: TransactionContext,
  ): Promise<boolean> {
    const [rows, sources] = await Promise.all([
      this.repository.findProfileSkillRows(userId, context),
      this.sources.load(userId, context),
    ]);

    const plan = planSkillReconciliation(rows, detected, sources.live);

    await this.repository.applyReconciliation(userId, plan, context);

    const updated = await this.repository.findProfileSkillRows(userId, context);
    const approved: string[] = [],
      pending: string[] = [];
    for (const row of updated) {
      const refs = parseEvidenceRefs(row.evidenceRefs);
      const written =
        row.source === 'manual' ||
        refs.some((ref) => sources.written.has(`${ref.type}:${ref.id}`));
      const eligible =
        written ||
        (row.source === 'nlp' &&
          refs.some((ref) =>
            sources.approved.has(`${ref.type}:${ref.id}:${row.skillId}`),
          ));
      if (
        eligible &&
        (row.verificationStatus === 'pending' ||
          (written && ['rejected', 'revoked'].includes(row.verificationStatus)))
      )
        approved.push(row.id);
      else if (
        !eligible &&
        row.verificationStatus === 'approved' &&
        row.radarAutoVerified
      )
        pending.push(row.id);
    }
    const decisions = await this.repository.applyAutomaticDecisions(
      userId,
      approved,
      pending,
      context,
    );
    return (
      decisions > 0 ||
      plan.creates.length + plan.updates.length + plan.deleteIds.length > 0
    );
  }

  async findSkillSummariesByUserIds(
    userIds: string[],
  ): Promise<UserSkillSummaryResponse[]> {
    if (userIds.length === 0) return [];
    const records = await this.repository.findSkillSummariesByUserIds(userIds);
    return records.map(toUserSkillSummary);
  }

  findApprovedRecruitmentReferences(userId: string, ids: string[]) {
    return this.repository.findApprovedRecruitmentReferences(userId, ids);
  }
}
