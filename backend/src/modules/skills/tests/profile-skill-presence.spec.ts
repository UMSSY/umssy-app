import type { UsersService } from '../../users/services/users.service.js';
import type { SkillEvidenceSourcesService } from '../services/skill-evidence-sources.service.js';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import { SkillAnalysisService } from '../services/skill-analysis.service.js';
import { UserSkillRepository } from '../repositories/user-skill.repository.js';
import { ProfileSkillsRadarMapper } from '../../nlp/mappers/profile-skills-radar.mapper.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';

const detected: ProfileSkillRowResponse = {
  id: 'detected-row',
  skillId: 'python',
  source: 'nlp',
  verificationStatus: 'approved',
  radarAutoVerified: false,
  isHighRelevance: false,
  evidenceRefs: [],
  skill: { name: 'Python', areaId: null },
};
const evidence = [{ type: 'education', id: 'education-1' }];
const manual: ProfileSkillRowResponse = { ...detected, source: 'manual' };

function setup(rows: ProfileSkillRowResponse[]) {
  const storedRows = rows.map((row) => ({ ...row, userId: 'owner-1' }));
  const userSkill = {
    findMany: vi.fn(
      async ({ where }: { where: { userId: string; source?: string } }) =>
        storedRows.filter(
          (row) =>
            row.userId === where.userId &&
            (!where.source || row.source === where.source),
        ),
    ),
  };
  const prisma = { userSkill } as unknown as PrismaService;
  const service = new SkillAnalysisService(
    new SkillAnalysisRepository(prisma),
    {} as SkillEvidenceSourcesService,
    {} as UsersService,
  );
  return { service, prisma };
}

describe('Profile skill presence', () => {
  it.each([
    { label: 'empty profile', rows: [], expected: false },
    { label: 'manual skill without evidence', rows: [manual], expected: true },
    {
      label: 'approved detection without evidence',
      rows: [detected],
      expected: false,
    },
    {
      label: 'detection with invalid evidence',
      rows: [
        {
          ...detected,
          evidenceRefs: [
            { type: 'unknown', id: 'x' },
            { type: 'cv', id: '' },
          ],
        },
      ],
      expected: false,
    },
    {
      label: 'detection with null evidence',
      rows: [{ ...detected, evidenceRefs: null }],
      expected: false,
    },
    {
      label: 'detection with a blank name',
      rows: [
        {
          ...detected,
          evidenceRefs: evidence,
          skill: { name: '   ', areaId: null },
        },
      ],
      expected: false,
    },
    {
      label: 'detection with an invalid name',
      rows: [
        {
          ...detected,
          evidenceRefs: evidence,
          skill: { name: '1234', areaId: null },
        },
      ],
      expected: false,
    },
    {
      label: 'manual skill alongside an invisible detection',
      rows: [detected, manual],
      expected: true,
    },
    {
      label: 'unrecognized source',
      rows: [{ ...detected, source: 'legacy', evidenceRefs: evidence }],
      expected: false,
    },
  ])(
    '$label contributes only when present in a profile list',
    async ({ rows, expected }) => {
      const { service, prisma } = setup(rows);
      const manuals = await new UserSkillRepository(prisma).findByUserId(
        'owner-1',
      );
      const radar = new ProfileSkillsRadarMapper().toRadarResponse(
        'owner-1',
        null,
        rows,
      );
      const hasVisibleSkills =
        manuals.length > 0 ||
        radar.skills.some((skill) => skill.source === 'nlp');
      expect(hasVisibleSkills).toBe(expected);
      await expect(service.hasProfileSkills('owner-1')).resolves.toBe(expected);
    },
  );

  it.each(['pending', 'approved', 'rejected', 'revoked'])(
    'counts visible detections regardless of verification status: %s',
    async (verificationStatus) => {
      const { service } = setup([
        { ...detected, verificationStatus, evidenceRefs: evidence },
      ]);
      await expect(service.hasProfileSkills('owner-1')).resolves.toBe(true);
    },
  );

  it('does not count skills owned by another profile', async () => {
    const { service } = setup([manual]);
    await expect(service.hasProfileSkills('owner-2')).resolves.toBe(false);
  });
});
