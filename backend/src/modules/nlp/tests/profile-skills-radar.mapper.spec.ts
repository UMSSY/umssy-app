import { describe, expect, it } from 'vitest';
import { ProfileSkillsRadarMapper } from '../mappers/profile-skills-radar.mapper.js';
import type { ProfileSkillProcessingState } from '../types/profile-skill-processing-state.type.js';
import type { ProfileSkillRow } from '../types/profile-skill-row.type.js';

const userId = '11111111-1111-4111-8111-111111111111';

const mapper = new ProfileSkillsRadarMapper();

const state = (
  overrides: Partial<ProfileSkillProcessingState> = {},
): ProfileSkillProcessingState => ({
  userId,
  status: 'ready',
  inputRevision: 3,
  processedRevision: 3,
  resultVersion: 2,
  updatedAt: new Date('2026-10-24T12:00:00.000Z'),
  dictionaryVersion: '1',
  ...overrides,
});

const rows: ProfileSkillRow[] = [
  {
    id: 'row-docker',
    skillId: 'skill-docker',
    source: 'manual',
    verificationStatus: 'pending',
    isHighRelevance: false,
    evidenceRefs: [{ type: 'education', id: 'e1' }],
    skill: {
      name: 'Docker',
      areaId: 'cloud-devops',
    },
  },
  {
    id: 'row-python',
    skillId: 'skill-python',
    source: 'nlp',
    verificationStatus: 'pending',
    isHighRelevance: true,
    evidenceRefs: [{ type: 'work-experience', id: 'w1' }],
    skill: {
      name: 'Python',
      areaId: 'data-ai',
    },
  },
];

describe('ProfileSkillsRadarMapper', () => {
  it.each([
    [
      'pending',
      {
        status: 'pending',
        processedRevision: 3,
        inputRevision: 4,
      },
    ],
    [
      'error',
      {
        status: 'error',
      },
    ],
    [
      'ready but outdated',
      {
        status: 'ready',
        processedRevision: 2,
      },
    ],
  ])(
    'preserves the last detected skills when the result is %s',
    (_label, overrides) => {
      const response = mapper.toRadarResponse(
        userId,
        state(overrides as Partial<ProfileSkillProcessingState>),
        rows,
      );

      expect(response.skills).toHaveLength(2);

      expect(response.skills).toEqual([
        expect.objectContaining({
          id: 'skill-docker',
          source: 'manual',
          isHighRelevance: false,
          evidenceRefs: [{ type: 'education', id: 'e1' }],
        }),
        expect.objectContaining({
          id: 'skill-python',
          source: 'nlp',
          isHighRelevance: false,
          evidenceRefs: [{ type: 'work-experience', id: 'w1' }],
        }),
      ]);
    },
  );
});