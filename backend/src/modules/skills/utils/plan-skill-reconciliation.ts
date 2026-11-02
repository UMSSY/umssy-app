import { USER_SKILL_SOURCES, USER_SKILL_VERIFICATION_STATUSES } from '../constants/user-skill.constants.js';
import type { DetectedSkillPayload } from '../types/detected-skill-payload.type.js';
import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
import type { SkillReconciliationPayload } from '../types/skill-reconciliation-payload.type.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import { parseEvidenceRefs } from './parse-evidence-refs.js';
import { sortEvidenceRefs } from './sort-evidence-refs.js';

const sameEvidence = (first: readonly SkillEvidenceRefPayload[], second: readonly SkillEvidenceRefPayload[]) =>
  JSON.stringify(first) === JSON.stringify(second);

export function planSkillReconciliation(
  rows: readonly ProfileSkillRowResponse[],
  detected: readonly DetectedSkillPayload[],
): SkillReconciliationPayload {
  const detectedBySkill = new Map(detected.map((skill) => [skill.id, sortEvidenceRefs(skill.evidenceRefs)]));
  const plan: SkillReconciliationPayload = { creates: [], updates: [], deleteIds: [] };

  for (const row of rows) {
    const evidenceRefs = detectedBySkill.get(row.skillId);
    detectedBySkill.delete(row.skillId);
    const isNlpRow = row.source === USER_SKILL_SOURCES.nlp;
    const keepsRow =
      !isNlpRow ||
      evidenceRefs !== undefined ||
      row.verificationStatus === USER_SKILL_VERIFICATION_STATUSES.approved;
    if (!keepsRow) {
      plan.deleteIds.push(row.id);
      continue;
    }
    const nextEvidence = evidenceRefs ?? [];
    const isHighRelevance = nextEvidence.length > 0;
    if (!sameEvidence(parseEvidenceRefs(row.evidenceRefs), nextEvidence) || row.isHighRelevance !== isHighRelevance) {
      plan.updates.push({ id: row.id, evidenceRefs: nextEvidence, isHighRelevance });
    }
  }

  for (const [skillId, evidenceRefs] of detectedBySkill) {
    plan.creates.push({ skillId, evidenceRefs });
  }
  return plan;
}
