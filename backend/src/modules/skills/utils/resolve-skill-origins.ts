import { USER_SKILL_SOURCES } from '../constants/user-skill.constants.js';
import type { SkillOrigin } from '../types/skill-origin.type.js';
import { parseEvidenceRefs } from './parse-evidence-refs.js';

export function resolveSkillOrigins(
  source: string,
  evidenceRefs: unknown,
): SkillOrigin[] {
  const detectedRefs = parseEvidenceRefs(evidenceRefs);
  const origins: SkillOrigin[] = [];

  if (source === USER_SKILL_SOURCES.manual) origins.push('manual');

  const linkedToExperience = detectedRefs.some(
    (ref) => ref.type === 'work-experience',
  );
  if (linkedToExperience) origins.push('experience');

  if (detectedRefs.some((ref) => ref.type === 'cv')) origins.push('cv');

  return origins;
}
