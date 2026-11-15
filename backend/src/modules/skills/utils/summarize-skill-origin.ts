import {
  USER_SKILL_ORIGINS,
  USER_SKILL_SOURCES,
  WORK_EXPERIENCE_REF_PREFIX,
} from '../constants/user-skill.constants.js';
import type { SkillOriginSummary } from '../types/skill-origin-summary.type.js';

function readLinkedExperienceId(ref: unknown): string | null {
  if (typeof ref === 'string') {
    return ref.startsWith(WORK_EXPERIENCE_REF_PREFIX)
      ? ref.slice(WORK_EXPERIENCE_REF_PREFIX.length)
      : null;
  }
  if (typeof ref !== 'object' || ref === null) return null;
  const { type, id } = ref as Record<string, unknown>;
  return type === 'work-experience' && typeof id === 'string' && id
    ? id
    : null;
}

/**
 * Single provenance rule for HU-10 (and HU-09): a skill is removable by the
 * user only when it is manual and has no evidence at all. Any link to a work
 * experience (or other profile source) protects it.
 */
export function summarizeSkillOrigin(
  source: string,
  evidenceRefs: unknown,
): SkillOriginSummary {
  const refs = Array.isArray(evidenceRefs) ? evidenceRefs : [];
  const experienceIds = new Set<string>();
  for (const ref of refs) {
    const id = readLinkedExperienceId(ref);
    if (id) experienceIds.add(id);
  }
  const linkedExperienceCount = experienceIds.size;

  if (linkedExperienceCount > 0) {
    return {
      origin: USER_SKILL_ORIGINS.experience,
      linkedExperienceCount,
      isRemovable: false,
    };
  }

  const isRemovable =
    source === USER_SKILL_SOURCES.manual && refs.length === 0;
  return {
    origin: isRemovable ? USER_SKILL_ORIGINS.manual : USER_SKILL_ORIGINS.other,
    linkedExperienceCount: 0,
    isRemovable,
  };
}
