import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
export function skillSourceRefs(value: unknown): SkillEvidenceRefPayload[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (ref): ref is SkillEvidenceRefPayload =>
      Boolean(ref) &&
      typeof ref === 'object' &&
      typeof ref.type === 'string' &&
      typeof ref.id === 'string',
  );
}
