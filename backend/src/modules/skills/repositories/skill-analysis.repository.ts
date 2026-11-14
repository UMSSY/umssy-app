import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import {
  USER_SKILL_SOURCES,
  USER_SKILL_VERIFICATION_STATUSES,
} from '../constants/user-skill.constants.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import type { SkillAnalysisCatalogResponse } from '../responses/skill-analysis-catalog.response.js';
import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
import type { SkillReconciliationPayload } from '../types/skill-reconciliation-payload.type.js';

export const profileSkillRowSelect = {
  id: true,
  skillId: true,
  source: true,
  verificationStatus: true,
  radarAutoVerified: true,
  isHighRelevance: true,
  evidenceRefs: true,
  skill: { select: { name: true, areaId: true } },
} as const;

const toJson = (refs: readonly SkillEvidenceRefPayload[]) =>
  refs.map((ref) => ({ type: ref.type, id: ref.id }));

@Injectable()
export class SkillAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasProfileSkills(userId: string): Promise<boolean> {
    const record = await this.prisma.userSkill.findFirst({
      where: { userId },
      select: { id: true },
    });
    return record !== null;
  }

  listReviewQueue() {
    return this.prisma.userSkill.findMany({
      where: {
        verificationStatus: {
          in: ['pending', 'approved', 'rejected', 'revoked'],
        },
      },
      include: {
        skill: true,
        user: { select: { firstName: true, lastName: true } },
      },
      take: 300,
      orderBy: { createdAt: 'desc' },
    });
  }

  skillForDecision(skillId: string, context: TransactionContext) {
    return context.client.userSkill.findUnique({
      where: { id: skillId },
      select: { userId: true, verificationStatus: true },
    });
  }

  changeSkillDecision(
    skillId: string,
    action: string,
    context: TransactionContext,
  ) {
    return context.client.userSkill.updateMany({
      where: { id: skillId, verificationStatus: { not: action } },
      data: { verificationStatus: action, radarAutoVerified: false },
    });
  }

  findCatalog(): Promise<SkillAnalysisCatalogResponse[]> {
    return this.prisma.skill.findMany({
      where: { isCustom: false },
      select: { id: true, name: true, areaId: true },
    });
  }

  async countPendingPublicationSkills(userId: string): Promise<number> {
    // Older reconciliations may have left pending NLP rows without a live source.
    const [row] = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM user_skills s
      WHERE s.user_id=${userId}::uuid AND s.verification_status='pending'
        AND (s.source='manual' OR EXISTS (
          SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.evidence_refs)='array'
            THEN s.evidence_refs ELSE '[]'::jsonb END) ref
          WHERE CASE ref->>'type'
            WHEN 'cv' THEN EXISTS (SELECT 1 FROM user_cv_file c WHERE c.id::text=ref->>'id' AND c.user_id=s.user_id AND c.cv_pdf_data IS NOT NULL)
            WHEN 'certification' THEN EXISTS (SELECT 1 FROM certifications c WHERE c.id::text=ref->>'id' AND c.user_id=s.user_id AND c.document_url IS NOT NULL)
            WHEN 'education' THEN EXISTS (SELECT 1 FROM educations e WHERE e.id::text=ref->>'id' AND e.user_id=s.user_id)
            WHEN 'work-experience' THEN EXISTS (SELECT 1 FROM work_experiences w WHERE w.id::text=ref->>'id' AND w.user_id=s.user_id)
            WHEN 'presentation' THEN ref->>'id'=s.user_id::text
            ELSE false END))`;
    return row.count;
  }

  findProfileSkillRows(
    userId: string,
    context?: TransactionContext,
  ): Promise<ProfileSkillRowResponse[]> {
    const client = context?.client ?? this.prisma;
    return client.userSkill.findMany({
      where: { userId },
      orderBy: { skill: { name: 'asc' } },
      select: profileSkillRowSelect,
    });
  }

  findApprovedPublicationSkills(userId: string, context: TransactionContext) {
    return context.client.userSkill.findMany({
      where: { userId, verificationStatus: 'approved' },
      select: {
        skillId: true,
        source: true,
        isHighRelevance: true,
        evidenceRefs: true,
        skill: { select: { name: true, areaId: true } },
      },
    });
  }

  async applyReconciliation(
    userId: string,
    plan: SkillReconciliationPayload,
    context: TransactionContext,
  ): Promise<number> {
    const client = context.client;
    if (plan.deleteIds.length > 0) {
      await client.userSkill.deleteMany({
        where: { userId, id: { in: plan.deleteIds } },
      });
    }
    for (const update of plan.updates) {
      await client.userSkill.update({
        where: { id: update.id, userId },
        data: {
          evidenceRefs: toJson(update.evidenceRefs),
          isHighRelevance: update.isHighRelevance,
        },
      });
    }
    if (plan.creates.length > 0) {
      await client.userSkill.createMany({
        data: plan.creates.map((create) => ({
          userId,
          skillId: create.skillId,
          source: USER_SKILL_SOURCES.nlp,
          verificationStatus: USER_SKILL_VERIFICATION_STATUSES.pending,
          isHighRelevance: true,
          evidenceRefs: toJson(create.evidenceRefs),
        })),
        skipDuplicates: true,
      });
    }
    // Re-evaluate document-derived approvals when evidence changes or disappears.
    return client.$executeRaw`
      WITH written AS (
        SELECT s.id FROM user_skills s WHERE s.user_id=${userId}::uuid AND
          (s.source='manual' OR EXISTS (SELECT 1 FROM jsonb_array_elements(coalesce(s.evidence_refs,'[]'::jsonb)) ref
            WHERE ref->>'type' IN ('presentation','education','work-experience')
               OR (ref->>'type'='certification' AND EXISTS(SELECT 1 FROM certifications c
                   WHERE c.id::text=ref->>'id' AND c.user_id=s.user_id AND c.document_url IS NULL))))
      ), eligible AS (
        SELECT id FROM written UNION
        SELECT DISTINCT s.id FROM user_skills s JOIN radar_document_verifications d
          ON d.user_id=s.user_id AND d.active AND d.status IN ('approved','manual_approved')
        WHERE s.user_id=${userId}::uuid AND s.source='nlp' AND d.skills @> jsonb_build_array(jsonb_build_object('id',s.skill_id::text))
          AND s.evidence_refs @> jsonb_build_array(jsonb_build_object('type',d.source_type,'id',d.source_id::text))
      ), changes AS (
        SELECT s.id, e.id IS NOT NULL AS eligible FROM user_skills s LEFT JOIN eligible e ON e.id=s.id
        WHERE s.user_id=${userId}::uuid AND (((s.verification_status='pending' OR (s.verification_status IN ('revoked','rejected') AND s.id IN (SELECT id FROM written))) AND e.id IS NOT NULL)
          OR (s.verification_status='approved' AND s.radar_auto_verified AND e.id IS NULL))
      )
      UPDATE user_skills s SET verification_status=CASE WHEN c.eligible THEN 'approved' ELSE 'pending' END,
        radar_auto_verified=c.eligible,updated_at=clock_timestamp() FROM changes c WHERE c.id=s.id`;
  }

  findApprovedRecruitmentReferences(userId: string, ids: string[]) {
    return this.prisma.userSkill.findMany({
      where: { userId, verificationStatus: 'approved', skillId: { in: ids } },
      select: { skillId: true, evidenceRefs: true },
    });
  }
}
