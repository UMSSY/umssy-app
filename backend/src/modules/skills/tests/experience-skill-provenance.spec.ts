import { describe, expect, it } from 'vitest';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';
import { resolveSkillOrigins } from '../utils/resolve-skill-origins.js';

const experienceA = { type: 'work-experience' as const, id: 'exp-a' };
const experienceB = { type: 'work-experience' as const, id: 'exp-b' };

function row(source: 'manual' | 'nlp', evidenceRefs: unknown): ProfileSkillRowResponse {
  return {
    id: 'python-row',
    skillId: 'python',
    source,
    evidenceRefs,
    verificationStatus: 'approved',
    radarAutoVerified: source === 'nlp',
    isHighRelevance: true,
    skill: { name: 'Python', areaId: null },
  };
}

describe('Experience skill provenance (HU-08)', () => {
  it('restores the manual origin after the final experience reference is removed', () => {
    expect(resolveSkillOrigins('manual', [])).toEqual(['manual']);

    const linked = planSkillReconciliation(
      [row('manual', [])],
      [{ id: 'python', name: 'Python', evidenceRefs: [experienceA] }],
    );
    expect(linked.creates).toEqual([]);
    expect(linked.updates).toEqual([
      {
        id: 'python-row',
        evidenceRefs: [experienceA],
        isHighRelevance: true,
      },
    ]);
    expect(resolveSkillOrigins('manual', [experienceA])).toEqual([
      'manual',
      'experience',
    ]);

    const unlinked = planSkillReconciliation([row('manual', [experienceA])], []);
    expect(unlinked.deleteIds).toEqual([]);
    expect(unlinked.updates[0]?.evidenceRefs).toEqual([]);
    expect(resolveSkillOrigins('manual', [])).toEqual(['manual']);
  });

  it('deduplicates automatic skills across experiences and removes only the final one', () => {
    const detected = planSkillReconciliation([], [
      { id: 'python', name: 'Python', evidenceRefs: [experienceA] },
      { id: 'python', name: 'Python', evidenceRefs: [experienceB] },
    ]);
    expect(detected.creates).toEqual([
      { skillId: 'python', evidenceRefs: [experienceA, experienceB] },
    ]);

    const remaining = planSkillReconciliation(
      [row('nlp', [experienceA, experienceB])],
      [{ id: 'python', name: 'Python', evidenceRefs: [experienceB] }],
    );
    expect(remaining.deleteIds).toEqual([]);
    expect(remaining.updates[0]?.evidenceRefs).toEqual([experienceB]);

    const removed = planSkillReconciliation([row('nlp', [experienceB])], []);
    expect(removed.deleteIds).toEqual(['python-row']);
  });

  it('recognizes both legacy and structured experience references', () => {
    expect(resolveSkillOrigins('manual', ['work_experience:exp-a'])).toEqual([
      'manual',
      'experience',
    ]);
    expect(resolveSkillOrigins('nlp', [experienceA])).toEqual(['experience']);
    expect(resolveSkillOrigins('manual', [])).toEqual(['manual']);
  });
});
