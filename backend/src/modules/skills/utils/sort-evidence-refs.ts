import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';

export function sortEvidenceRefs(refs: readonly SkillEvidenceRefPayload[]): SkillEvidenceRefPayload[] {
  const unique = new Map(refs.map((ref) => [`${ref.type}:${ref.id}`, { type: ref.type, id: ref.id }]));
  return [...unique.entries()]
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([, ref]) => ref);
}
