import { describe, expect, it } from 'vitest';
import { summarizeSkillOrigin } from '../utils/summarize-skill-origin.js';

describe('summarizeSkillOrigin', () => {
  it('AC-10.1: a skill linked to an experience is not removable, even if manual', () => {
    expect(
      summarizeSkillOrigin('manual', ['work_experience:exp-1']),
    ).toEqual({
      origin: 'experience',
      linkedExperienceCount: 1,
      isRemovable: false,
    });
  });

  it('AC-10.2: a manual skill without links is removable', () => {
    expect(summarizeSkillOrigin('manual', [])).toEqual({
      origin: 'manual',
      linkedExperienceCount: 0,
      isRemovable: true,
    });
    expect(summarizeSkillOrigin('manual', null)).toMatchObject({
      isRemovable: true,
    });
  });

  it('AC-10.6: counts distinct experiences across both reference formats', () => {
    expect(
      summarizeSkillOrigin('manual', [
        'work_experience:exp-1',
        { type: 'work-experience', id: 'exp-1' },
        { type: 'work-experience', id: 'exp-2' },
      ]),
    ).toEqual({
      origin: 'experience',
      linkedExperienceCount: 2,
      isRemovable: false,
    });
  });

  it('AC-10.5: the chip becomes removable again when the last link disappears', () => {
    expect(summarizeSkillOrigin('manual', ['work_experience:a']).isRemovable)
      .toBe(false);
    expect(summarizeSkillOrigin('manual', []).isRemovable).toBe(true);
  });

  it('protects skills backed by other sources or detected by NLP', () => {
    expect(
      summarizeSkillOrigin('manual', [{ type: 'education', id: 'e1' }]),
    ).toEqual({ origin: 'other', linkedExperienceCount: 0, isRemovable: false });
    expect(summarizeSkillOrigin('nlp', [])).toEqual({
      origin: 'other',
      linkedExperienceCount: 0,
      isRemovable: false,
    });
  });

  it('ignores malformed references', () => {
    expect(
      summarizeSkillOrigin('manual', [null, 3, { type: 'work-experience' }]),
    ).toMatchObject({ linkedExperienceCount: 0 });
  });
});
