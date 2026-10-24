import { USER_SKILL_SOURCES, USER_SKILL_VERIFICATION_STATUSES } from '../../skills/constants/user-skill.constants.js';
import type { NlpDetectedSkill } from '../types/nlp-detected-skill.type.js';
import type { NlpEvidenceRef } from '../types/nlp-evidence-ref.type.js';
import type { NlpSkillReconciliation } from '../types/nlp-skill-reconciliation.type.js';
import type { ProfileSkillRow } from '../types/profile-skill-row.type.js';
import { parseEvidenceRefs } from './parse-evidence-refs.js';
import { sortEvidenceRefs } from './sort-evidence-refs.js';

const sameEvidence = (first: readonly NlpEvidenceRef[], second: readonly NlpEvidenceRef[]) =>
  JSON.stringify(first) === JSON.stringify(second);

// Manual rows are never removed: they only receive the NLP evidence. Detected rows follow the current text,
// except approved ones, which keep the human decision even when their evidence disappears.
export function planSkillReconciliation(
  rows: readonly ProfileSkillRow[],
  detected: readonly NlpDetectedSkill[],
): NlpSkillReconciliation {
  const detectedBySkill = new Map(detected.map((skill) => [skill.id, sortEvidenceRefs(skill.evidenceRefs)]));
  const plan: NlpSkillReconciliation = { creates: [], updates: [], deleteIds: [] };

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
