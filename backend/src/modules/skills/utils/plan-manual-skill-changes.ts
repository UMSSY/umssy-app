import { USER_SKILL_SOURCES } from '../constants/user-skill.constants.js';
import type { ManualSkillChanges } from '../types/manual-skill-changes.type.js';
import type { UserSkillSourceRow } from '../types/user-skill-source-row.type.js';

const hasEvidence = (value: unknown) => Array.isArray(value) && value.length > 0;

// The user only edits the manual list. Rows detected by the NLP stay untouched, and a manual skill that the
// user removes but that the text still supports becomes a detected skill instead of disappearing.
export function planManualSkillChanges(
  rows: readonly UserSkillSourceRow[],
  skillIds: readonly string[],
): ManualSkillChanges {
  const requested = new Set(skillIds);
  const existing = new Set(rows.map((row) => row.skillId));
  const changes: ManualSkillChanges = {
    createSkillIds: skillIds.filter((skillId) => !existing.has(skillId)),
    toManualIds: [],
    toDetectedIds: [],
    deleteIds: [],
  };

  for (const row of rows) {
    const isDetected = row.source === USER_SKILL_SOURCES.nlp;
    if (requested.has(row.skillId)) {
      if (isDetected) changes.toManualIds.push(row.id);
    } else if (!isDetected) {
      (hasEvidence(row.evidenceRefs) ? changes.toDetectedIds : changes.deleteIds).push(row.id);
    }
  }
  return changes;
}
