import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
import { buildExperienceRef } from './build-experience-ref.js';
import { sortEvidenceRefs } from './sort-evidence-refs.js';

const SOURCE_TYPES: ReadonlySet<SkillEvidenceRefPayload['type']> = new Set([
  'work-experience',
  'education',
  'presentation',
  'certification',
  'cv',
]);

function isEvidenceRef(value: unknown): value is SkillEvidenceRefPayload {
  if (typeof value !== 'object' || value === null) return false;
  const { type, id } = value as Record<string, unknown>;
  return (
    SOURCE_TYPES.has(type as SkillEvidenceRefPayload['type']) &&
    typeof id === 'string' &&
    id.length > 0
  );
}

export function parseEvidenceRef(
  value: unknown,
): SkillEvidenceRefPayload | undefined {
  if (isEvidenceRef(value)) return { type: value.type, id: value.id };
  const prefix = buildExperienceRef('');
  if (typeof value === 'string' && value.startsWith(prefix)) {
    const id = value.slice(prefix.length);
    if (id) return { type: 'work-experience', id };
  }
  return undefined;
}

export function parseEvidenceRefs(value: unknown): SkillEvidenceRefPayload[] {
  return Array.isArray(value)
    ? sortEvidenceRefs(
        value.flatMap((item) => {
          const ref = parseEvidenceRef(item);
          return ref ? [ref] : [];
        }),
      )
    : [];
}
