import type { NlpEvidenceRef } from '../types/nlp-evidence-ref.type.js';
import type { NlpSourceType } from '../types/nlp-source-type.type.js';
import { sortEvidenceRefs } from './sort-evidence-refs.js';

const SOURCE_TYPES: ReadonlySet<NlpSourceType> = new Set(['work-experience', 'education']);

function isEvidenceRef(value: unknown): value is NlpEvidenceRef {
  if (typeof value !== 'object' || value === null) return false;
  const { type, id } = value as Record<string, unknown>;
  return SOURCE_TYPES.has(type as NlpSourceType) && typeof id === 'string' && id.length > 0;
}

// The column is JSON, so anything that is not a valid reference is ignored.
export function parseEvidenceRefs(value: unknown): NlpEvidenceRef[] {
  return Array.isArray(value) ? sortEvidenceRefs(value.filter(isEvidenceRef)) : [];
}
