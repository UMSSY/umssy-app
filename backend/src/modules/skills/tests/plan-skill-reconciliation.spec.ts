import { describe, expect, it } from 'vitest';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import type { DetectedSkillPayload } from '../types/detected-skill-payload.type.js';
import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';

const deletedExperience: SkillEvidenceRefPayload = {
  type: 'work-experience',
  id: 'experience-deleted',
};
const remainingExperience: SkillEvidenceRefPayload = {
  type: 'work-experience',
  id: 'experience-remaining',
};

function row(
  overrides: Partial<ProfileSkillRowResponse> & { skillId: string },
): ProfileSkillRowResponse {
  return {
    id: `${overrides.skillId}-row`,
    source: 'nlp',
    verificationStatus: 'pending',
    isHighRelevance: true,
    evidenceRefs: [],
    skill: { name: overrides.skillId, areaId: null },
    ...overrides,
  };
}

function detected(
  skillId: string,
  evidenceRefs: SkillEvidenceRefPayload[],
): DetectedSkillPayload {
  return { id: skillId, name: skillId, evidenceRefs };
}

describe('planSkillReconciliation after deleting a work experience (HU-09)', () => {
  it('keeps a skill that is still detected in another experience and drops the deleted link (AC-09.1)', () => {
    const plan = planSkillReconciliation(
      [
        row({
          skillId: 'git',
          evidenceRefs: [deletedExperience, remainingExperience],
        }),
      ],
      [detected('git', [remainingExperience])],
    );

    expect(plan.deleteIds).toEqual([]);
    expect(plan.creates).toEqual([]);
    expect(plan.updates).toEqual([
      {
        id: 'git-row',
        evidenceRefs: [remainingExperience],
        isHighRelevance: true,
      },
    ]);
  });

  it('keeps a skill with a manual origin even when its only experience is deleted (AC-09.2)', () => {
    const plan = planSkillReconciliation(
      [
        row({
          skillId: 'python',
          source: 'manual',
          evidenceRefs: [deletedExperience],
        }),
      ],
      [],
    );

    expect(plan.deleteIds).toEqual([]);
    expect(plan.updates).toEqual([
      { id: 'python-row', evidenceRefs: [], isHighRelevance: false },
    ]);
  });

  it('removes a detected skill that was linked only to the deleted experience (AC-09.3)', () => {
    const plan = planSkillReconciliation(
      [row({ skillId: 'docker', evidenceRefs: [deletedExperience] })],
      [],
    );

    expect(plan.deleteIds).toEqual(['docker-row']);
    expect(plan.updates).toEqual([]);
    expect(plan.creates).toEqual([]);
  });

  it('keeps a manual skill and its remaining experience links when one experience is deleted (AC-09.4)', () => {
    const plan = planSkillReconciliation(
      [
        row({
          skillId: 'sql',
          source: 'manual',
          evidenceRefs: [deletedExperience, remainingExperience],
        }),
      ],
      [detected('sql', [remainingExperience])],
    );

    expect(plan.deleteIds).toEqual([]);
    expect(plan.updates).toEqual([
      {
        id: 'sql-row',
        evidenceRefs: [remainingExperience],
        isHighRelevance: true,
      },
    ]);
  });

  it('only removes the skills without another source when several are affected at once', () => {
    const plan = planSkillReconciliation(
      [
        row({
          skillId: 'git',
          evidenceRefs: [deletedExperience, remainingExperience],
        }),
        row({
          skillId: 'python',
          source: 'manual',
          evidenceRefs: [deletedExperience],
        }),
        row({ skillId: 'docker', evidenceRefs: [deletedExperience] }),
      ],
      [detected('git', [remainingExperience])],
    );

    expect(plan.deleteIds).toEqual(['docker-row']);
    expect(plan.updates.map((update) => update.id)).toEqual([
      'git-row',
      'python-row',
    ]);
  });
});
