import { describe, expect, it } from 'vitest';
import { ProfileSkillsRadarMapper } from '../mappers/profile-skills-radar.mapper.js';
import type { ProfileSkillProcessingState } from '../types/profile-skill-processing-state.type.js';
import type { ProfileSkillRow } from '../types/profile-skill-row.type.js';

const userId = '11111111-1111-4111-8111-111111111111';
const updatedAt = new Date('2026-10-23T15:00:00.000Z');

const state = (overrides: Partial<ProfileSkillProcessingState> = {}): ProfileSkillProcessingState => ({
  userId,
  status: 'ready',
  inputRevision: 3,
  processedRevision: 3,
  resultVersion: 2,
  updatedAt,
  dictionaryVersion: '1.0.0',
  ...overrides,
});

const rows: ProfileSkillRow[] = [
  {
    id: 'row-python',
    skillId: 'skill-python',
    source: 'nlp',
    verificationStatus: 'pending',
    isHighRelevance: true,
    evidenceRefs: [{ type: 'work-experience', id: 'w1' }],
    skill: { name: 'Python', areaId: 'data-ai' },
  },
  {
    id: 'row-docker',
    skillId: 'skill-docker',
    source: 'manual',
    verificationStatus: 'pending',
    isHighRelevance: true,
    evidenceRefs: [{ type: 'education', id: 'e1' }],
    skill: { name: 'Docker', areaId: null },
  },
  {
    id: 'row-invalid',
    skillId: 'skill-invalid',
    source: 'manual',
    verificationStatus: 'pending',
    isHighRelevance: false,
    evidenceRefs: [],
    skill: { name: 'Seed: <script>', areaId: null },
  },
];

describe('ProfileSkillsRadarMapper', () => {
  const mapper = new ProfileSkillsRadarMapper();

  it('serves the consolidated list when the last revision is processed', () => {
    expect(mapper.toRadarResponse(userId, state(), rows)).toEqual({
      userId,
      status: 'ready',
      version: 2,
      updatedAt: '2026-10-23T15:00:00.000Z',
      dictionaryVersion: '1.0.0',
      skills: [
        {
          id: 'skill-docker',
          text: 'Docker',
          name: 'Docker',
          source: 'manual',
          areaId: null,
          verificationStatus: 'pending',
          isHighRelevance: true,
          evidenceRefs: [{ type: 'education', id: 'e1' }],
        },
        {
          id: 'skill-python',
          text: 'Python',
          name: 'Python',
          source: 'nlp',
          areaId: 'data-ai',
          verificationStatus: 'pending',
          isHighRelevance: true,
          evidenceRefs: [{ type: 'work-experience', id: 'w1' }],
        },
      ],
    });
  });

  it.each([
    ['pending', { status: 'pending', processedRevision: 3, inputRevision: 4 }],
    ['error', { status: 'error' }],
    ['ready but outdated', { status: 'ready', processedRevision: 2 }],
  ])('only serves manual skills without NLP data when the result is %s', (_label, overrides) => {
    const response = mapper.toRadarResponse(userId, state(overrides), rows);

    expect(response.skills).toEqual([
      expect.objectContaining({ id: 'skill-docker', source: 'manual', isHighRelevance: false, evidenceRefs: [] }),
    ]);
  });

  it('reports a pending empty result for a profile that was never analyzed', () => {
    expect(mapper.toRadarResponse(userId, null, [])).toEqual({
      userId,
      status: 'pending',
      version: 0,
      updatedAt: null,
      dictionaryVersion: null,
      skills: [],
    });
  });

  it('falls back to pending for an unknown stored status', () => {
    expect(mapper.toRadarResponse(userId, state({ status: 'paused' }), []).status).toBe('pending');
  });

  it('adds the analysis summary to the snapshot', () => {
    const snapshot = mapper.toRadarResponse(userId, null, []);
    const discarded = [{ name: 'Kubernetes', reason: 'not-in-catalog' as const, message: 'x' }];

    expect(mapper.toAnalysisResponse(snapshot, { status: 'ready', discarded, rejectedSources: [] })).toEqual({
      ...snapshot,
      analysis: { discarded, rejectedSources: [] },
    });
  });
});
