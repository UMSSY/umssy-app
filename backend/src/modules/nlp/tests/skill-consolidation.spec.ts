import { describe, expect, it } from 'vitest';
import type { NlpDetectedSkill } from '../types/nlp-detected-skill.type.js';
import type { ProfileSkillRow } from '../types/profile-skill-row.type.js';
import { parseEvidenceRefs } from '../utils/parse-evidence-refs.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';
import { sortEvidenceRefs } from '../utils/sort-evidence-refs.js';

const row = (overrides: Partial<ProfileSkillRow>): ProfileSkillRow => ({
  id: 'row-1',
  skillId: 'skill-1',
  source: 'manual',
  verificationStatus: 'pending',
  isHighRelevance: false,
  evidenceRefs: [],
  skill: { name: 'Docker', areaId: null },
  ...overrides,
});

const detected = (id: string, evidenceIds: string[]): NlpDetectedSkill => ({
  id,
  name: id,
  source: 'nlp',
  verificationStatus: 'pending',
  evidenceRefs: evidenceIds.map((evidenceId) => ({ type: 'work-experience', id: evidenceId })),
});

describe('sortEvidenceRefs', () => {
  it('removes duplicated references and sorts them', () => {
    expect(
      sortEvidenceRefs([
        { type: 'work-experience', id: 'b' },
        { type: 'education', id: 'a' },
        { type: 'work-experience', id: 'b' },
      ]),
    ).toEqual([
      { type: 'education', id: 'a' },
      { type: 'work-experience', id: 'b' },
    ]);
  });
});

describe('parseEvidenceRefs', () => {
  it('keeps only valid references from the JSON column', () => {
    expect(
      parseEvidenceRefs([
        { type: 'work-experience', id: 'w1' },
        { type: 'document', id: 'd1' },
        { type: 'education', id: '' },
        { type: 'education' },
        'text',
        null,
      ]),
    ).toEqual([{ type: 'work-experience', id: 'w1' }]);
  });

  it('reads anything that is not a list as no evidence', () => {
    expect(parseEvidenceRefs(null)).toEqual([]);
    expect(parseEvidenceRefs({ type: 'education', id: 'e1' })).toEqual([]);
  });
});

describe('planSkillReconciliation', () => {
  it('creates a row for a new detected skill', () => {
    expect(planSkillReconciliation([], [detected('skill-2', ['w1'])])).toEqual({
      creates: [{ skillId: 'skill-2', evidenceRefs: [{ type: 'work-experience', id: 'w1' }] }],
      updates: [],
      deleteIds: [],
    });
  });

  it('keeps a manual skill as one row and adds the NLP evidence to it', () => {
    const plan = planSkillReconciliation([row({})], [detected('skill-1', ['w1'])]);

    expect(plan).toEqual({
      creates: [],
      updates: [{ id: 'row-1', evidenceRefs: [{ type: 'work-experience', id: 'w1' }], isHighRelevance: true }],
      deleteIds: [],
    });
  });

  it('never deletes a manual skill, even without evidence', () => {
    const plan = planSkillReconciliation(
      [row({ evidenceRefs: [{ type: 'work-experience', id: 'w1' }], isHighRelevance: true })],
      [],
    );

    expect(plan.deleteIds).toEqual([]);
    expect(plan.updates).toEqual([{ id: 'row-1', evidenceRefs: [], isHighRelevance: false }]);
  });

  it('removes a detected skill whose evidence disappeared', () => {
    const plan = planSkillReconciliation([row({ source: 'nlp', evidenceRefs: [{ type: 'education', id: 'e1' }] })], []);
    expect(plan).toEqual({ creates: [], updates: [], deleteIds: ['row-1'] });
  });

  it('keeps an approved detected skill without evidence', () => {
    const plan = planSkillReconciliation(
      [row({ source: 'nlp', verificationStatus: 'approved', evidenceRefs: [{ type: 'education', id: 'e1' }], isHighRelevance: true })],
      [],
    );

    expect(plan).toEqual({
      creates: [],
      updates: [{ id: 'row-1', evidenceRefs: [], isHighRelevance: false }],
      deleteIds: [],
    });
  });

  it('changes nothing when the evidence is the same', () => {
    const plan = planSkillReconciliation(
      [row({ source: 'nlp', evidenceRefs: [{ type: 'work-experience', id: 'w1' }], isHighRelevance: true })],
      [detected('skill-1', ['w1'])],
    );

    expect(plan).toEqual({ creates: [], updates: [], deleteIds: [] });
  });

  it('corrects a stale relevance flag even when the evidence did not change', () => {
    const evidenceRefs = [{ type: 'work-experience' as const, id: 'w1' }];
    const plan = planSkillReconciliation(
      [row({ source: 'nlp', evidenceRefs, isHighRelevance: false })],
      [detected('skill-1', ['w1'])],
    );

    expect(plan).toEqual({
      creates: [],
      updates: [{ id: 'row-1', evidenceRefs, isHighRelevance: true }],
      deleteIds: [],
    });
  });

  it('keeps an unchanged manual skill without evidence or unnecessary updates', () => {
    expect(planSkillReconciliation([row({})], [])).toEqual({
      creates: [],
      updates: [],
      deleteIds: [],
    });
  });

  it('preserves manual origin and approval while returning a separate update plan', () => {
    const manual = row({ verificationStatus: 'approved' });
    const nlpSkill = detected('skill-1', ['w1']);
    const originalManual = structuredClone(manual);
    const originalDetection = structuredClone(nlpSkill);

    const plan = planSkillReconciliation([manual], [nlpSkill]);

    expect(plan.creates).toEqual([]);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.updates).toEqual([
      { id: 'row-1', evidenceRefs: [{ type: 'work-experience', id: 'w1' }], isHighRelevance: true },
    ]);
    expect(manual).toEqual(originalManual);
    expect(nlpSkill).toEqual(originalDetection);
  });

  it('updates the evidence of a detected skill when the sources change', () => {
    const plan = planSkillReconciliation(
      [row({ source: 'nlp', evidenceRefs: [{ type: 'work-experience', id: 'w1' }], isHighRelevance: true })],
      [detected('skill-1', ['w2', 'w1'])],
    );

    expect(plan.updates).toEqual([
      {
        id: 'row-1',
        evidenceRefs: [
          { type: 'work-experience', id: 'w1' },
          { type: 'work-experience', id: 'w2' },
        ],
        isHighRelevance: true,
      },
    ]);
  });

  it('produces an empty plan for a profile without skills or texts', () => {
    expect(planSkillReconciliation([], [])).toEqual({ creates: [], updates: [], deleteIds: [] });
  });
});
