import { USER_SKILL_SOURCES } from '../constants/user-skill.constants.js';
import type { DetectedSkillPayload } from '../types/detected-skill-payload.type.js';
import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
import type { SkillReconciliationPayload } from '../types/skill-reconciliation-payload.type.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import { parseEvidenceRefs } from './parse-evidence-refs.js';
import { sortEvidenceRefs } from './sort-evidence-refs.js';

type ResolvedDetection = {
  skillId: string;
  nameKey: string;
  evidenceRefs: SkillEvidenceRefPayload[];
};

const sameEvidence = (
  first: readonly SkillEvidenceRefPayload[],
  second: readonly SkillEvidenceRefPayload[],
): boolean => JSON.stringify(first) === JSON.stringify(second);

export function planSkillReconciliation(
  rows: readonly ProfileSkillRowResponse[],
  detected: readonly DetectedSkillPayload[],
): SkillReconciliationPayload {
  const detectedById = new Map<string, ResolvedDetection>();
  const detectedByName = new Map<string, ResolvedDetection>();

  for (const skill of detected) {
    const rawSkill = skill as DetectedSkillPayload & {
      skillId?: string;
      id?: string;
      name?: string;
    };

    const resolvedId = rawSkill.skillId ?? rawSkill.id;

    if (!resolvedId) {
      continue;
    }

    const skillId = String(resolvedId);
    const nameKey = (rawSkill.name ?? '').toLowerCase().trim();
    const evidenceRefs = sortEvidenceRefs(skill.evidenceRefs);

    const existing = detectedById.get(skillId);

    const detection: ResolvedDetection = {
      skillId,
      nameKey,
      evidenceRefs: sortEvidenceRefs([
        ...(existing?.evidenceRefs ?? []),
        ...evidenceRefs,
      ]),
    };

    detectedById.set(skillId, detection);

    if (nameKey) {
      detectedByName.set(nameKey, detection);
    }
  }

  const plan: SkillReconciliationPayload = {
    creates: [],
    updates: [],
    deleteIds: [],
  };

  const consumedSkillIds = new Set<string>();

  for (const row of rows) {
    const nameKey = row.skill?.name
      ? row.skill.name.toLowerCase().trim()
      : '';

    const detection =
      detectedById.get(row.skillId) ??
      (nameKey ? detectedByName.get(nameKey) : undefined);

    if (detection) {
      consumedSkillIds.add(detection.skillId);
    }

    const isManualRow = row.source === USER_SKILL_SOURCES.manual;
    const isApproved = row.verificationStatus === 'approved';

    if (isManualRow) {
      const nextEvidence = detection?.evidenceRefs ?? [];
      const nextIsHighRelevance = nextEvidence.length > 0;
      const currentEvidence = parseEvidenceRefs(row.evidenceRefs);

      if (
        !sameEvidence(currentEvidence, nextEvidence) ||
        row.isHighRelevance !== nextIsHighRelevance
      ) {
        plan.updates.push({
          id: row.id,
          evidenceRefs: nextEvidence,
          isHighRelevance: nextIsHighRelevance,
        });
      }

      continue;
    }

    if (!detection) {
      if (!isApproved) {
        plan.deleteIds.push(row.id);
        continue;
      }

      const currentEvidence = parseEvidenceRefs(row.evidenceRefs);

      if (currentEvidence.length > 0 || row.isHighRelevance) {
        plan.updates.push({
          id: row.id,
          evidenceRefs: [],
          isHighRelevance: false,
        });
      }

      continue;
    }

    const nextEvidence = detection.evidenceRefs;
    const nextIsHighRelevance = nextEvidence.length > 0;
    const currentEvidence = parseEvidenceRefs(row.evidenceRefs);

    if (
      !sameEvidence(currentEvidence, nextEvidence) ||
      row.isHighRelevance !== nextIsHighRelevance
    ) {
      plan.updates.push({
        id: row.id,
        evidenceRefs: nextEvidence,
        isHighRelevance: nextIsHighRelevance,
      });
    }
  }

  for (const detection of detectedById.values()) {
    if (consumedSkillIds.has(detection.skillId)) {
      continue;
    }

    plan.creates.push({
      skillId: detection.skillId,
      evidenceRefs: detection.evidenceRefs,
    });
  }

  return plan;
}