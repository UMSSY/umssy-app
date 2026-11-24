import { describe, expect, it } from 'vitest';
import { resolveSkillOrigins } from '../utils/resolve-skill-origins.js';

const experienceRef = 'work_experience:11111111-1111-4111-8111-111111111111';
const detectedExperience = {
  type: 'work-experience',
  id: '22222222-2222-4222-8222-222222222222',
};
const cv = { type: 'cv', id: '33333333-3333-4333-8333-333333333333' };
const education = {
  type: 'education',
  id: '44444444-4444-4444-8444-444444444444',
};
const certification = {
  type: 'certification',
  id: '55555555-5555-4555-8555-555555555555',
};

describe('resolveSkillOrigins', () => {
  it('marks a manual skill without evidence as manual only', () => {
    expect(resolveSkillOrigins('manual', [])).toEqual(['manual']);
  });

  it('adds the experience origin when a work experience is linked', () => {
    expect(resolveSkillOrigins('manual', [experienceRef])).toEqual([
      'manual',
      'experience',
    ]);
  });

  it('keeps the experience origin of a skill that is not manual', () => {
    expect(resolveSkillOrigins('nlp', [experienceRef])).toEqual(['experience']);
  });

  it('treats an experience that detected the skill as an experience origin', () => {
    expect(resolveSkillOrigins('nlp', [detectedExperience])).toEqual([
      'experience',
    ]);
  });

  it('marks a skill detected in the CV with the cv origin', () => {
    expect(resolveSkillOrigins('nlp', [cv])).toEqual(['cv']);
  });

  it('keeps every origin of a manual skill backed by an experience and the CV', () => {
    expect(
      resolveSkillOrigins('manual', [experienceRef, detectedExperience, cv]),
    ).toEqual(['manual', 'experience', 'cv']);
  });

  it('does not count education or certifications as experience or CV', () => {
    expect(resolveSkillOrigins('nlp', [education, certification])).toEqual([]);
    expect(resolveSkillOrigins('manual', [education])).toEqual(['manual']);
  });

  it('ignores text refs that do not point to a work experience', () => {
    expect(resolveSkillOrigins('manual', ['education:abc'])).toEqual([
      'manual',
    ]);
  });

  it.each([null, undefined, {}, '[]', 5])(
    'ignores evidence that is not a list: %j',
    (evidenceRefs) => {
      expect(resolveSkillOrigins('manual', evidenceRefs)).toEqual(['manual']);
      expect(resolveSkillOrigins('nlp', evidenceRefs)).toEqual([]);
    },
  );
});
