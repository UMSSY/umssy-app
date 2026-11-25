import { parseEvidenceRefs } from './parse-evidence-refs.js';
import { validateSkillName } from './validate-skill-name.js';

export function isVisibleNlpSkill(
  name: string,
  evidenceRefs: unknown,
): boolean {
  return (
    validateSkillName(name).isValid &&
    parseEvidenceRefs(evidenceRefs).length > 0
  );
}
