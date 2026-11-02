import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
import { sortEvidenceRefs } from './sort-evidence-refs.js';

const SOURCE_TYPES: ReadonlySet<SkillEvidenceRefPayload['type']> = new Set(['work-experience', 'education']);

function isEvidenceRef(value: unknown): value is SkillEvidenceRefPayload {
  if (typeof value !== 'object' || value === null) return false;
  const { type, id } = value as Record<string, unknown>;
  return SOURCE_TYPES.has(type as SkillEvidenceRefPayload['type']) && typeof id === 'string' && id.length > 0;
}

export function parseEvidenceRefs(value: unknown): SkillEvidenceRefPayload[] {
  return Array.isArray(value) ? sortEvidenceRefs(value.filter(isEvidenceRef)) : [];
}
