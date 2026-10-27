import { describe, expect, it } from 'vitest';
import type { UserSkillSourceRow } from '../types/user-skill-source-row.type.js';
import { planManualSkillChanges } from '../utils/plan-manual-skill-changes.js';

const row = (overrides: Partial<UserSkillSourceRow>): UserSkillSourceRow => ({
  id: 'row-1',
  skillId: 'skill-1',
  source: 'manual',
  evidenceRefs: [],
  ...overrides,
});

describe('planManualSkillChanges', () => {
  it('creates the requested skills the user did not have', () => {
    expect(planManualSkillChanges([], ['skill-1', 'skill-2'])).toEqual({
      createSkillIds: ['skill-1', 'skill-2'],
      toManualIds: [],
      toDetectedIds: [],
      deleteIds: [],
    });
  });

  it('deletes a removed manual skill without evidence', () => {
    expect(planManualSkillChanges([row({})], []).deleteIds).toEqual(['row-1']);
  });

  it.each([null, {}, '[]'])('does not treat non-list JSON evidence %j as text support', (evidenceRefs) => {
    expect(planManualSkillChanges([row({ evidenceRefs })], [])).toEqual({
      createSkillIds: [],
      toManualIds: [],
      toDetectedIds: [],
      deleteIds: ['row-1'],
    });
  });

  it('keeps a removed manual skill as detected when the texts support it', () => {
    const changes = planManualSkillChanges([row({ evidenceRefs: [{ type: 'education', id: 'e1' }] })], []);
    expect(changes).toEqual({ createSkillIds: [], toManualIds: [], toDetectedIds: ['row-1'], deleteIds: [] });
  });

  it('turns a detected skill into a manual one when the user adds it', () => {
    const changes = planManualSkillChanges([row({ source: 'nlp' })], ['skill-1']);
    expect(changes).toEqual({ createSkillIds: [], toManualIds: ['row-1'], toDetectedIds: [], deleteIds: [] });
  });

  it('leaves detected skills that the user does not mention untouched', () => {
    const changes = planManualSkillChanges([row({ source: 'nlp' })], []);
    expect(changes).toEqual({ createSkillIds: [], toManualIds: [], toDetectedIds: [], deleteIds: [] });
  });

  it('keeps a manual skill that is still requested', () => {
    const changes = planManualSkillChanges([row({})], ['skill-1']);
    expect(changes).toEqual({ createSkillIds: [], toManualIds: [], toDetectedIds: [], deleteIds: [] });
  });
});
