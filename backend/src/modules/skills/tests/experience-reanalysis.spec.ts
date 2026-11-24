import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import type { UsersService } from '../../users/services/users.service.js';
import type { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import { UserSkillEvidenceRepository } from '../repositories/user-skill-evidence.repository.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import { SkillAnalysisService } from '../services/skill-analysis.service.js';
import type { SkillEvidenceSourcesService } from '../services/skill-evidence-sources.service.js';
import { parseEvidenceRefs } from '../utils/parse-evidence-refs.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';

const ref = { type: 'work-experience' as const, id: 'exp-a' };
const other = { type: 'work-experience' as const, id: 'exp-b' };
const live = new Set(['work-experience:exp-a', 'work-experience:exp-b']);
const row = (source = 'nlp', status = 'pending'): ProfileSkillRowResponse => ({
  id: 'docker-row',
  skillId: 'docker',
  source,
  verificationStatus: status,
  radarAutoVerified: source === 'nlp',
  isHighRelevance: true,
  evidenceRefs: ['work_experience:exp-a', other],
  skill: { name: 'Docker', areaId: null },
});

describe('Experience evidence across Matching and profile reanalysis', () => {
  it('keeps a newly persisted Matching skill when profile NLP returns no detections', async () => {
    let saved: ProfileSkillRowResponse | undefined;
    const userSkill = {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(({ data }) => {
        saved = { ...row(), ...data };
      }),
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback({ userSkill })),
    };
    await new UserSkillEvidenceRepository(
      prisma as unknown as PrismaService,
    ).replaceDetected('user', 'exp-a', ['docker']);
    expect(saved?.source).toBe('nlp');
    expect(saved?.verificationStatus).toBe('pending');
    const plan = planSkillReconciliation([saved!], [], live);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.creates).toEqual([]);
    expect(plan.updates).toEqual([]);
    expect(parseEvidenceRefs(saved?.evidenceRefs)).toEqual([ref]);
  });

  it.each([
    ['nlp', 'pending'],
    ['nlp', 'approved'],
    ['manual', 'approved'],
  ])(
    'preserves %s/%s evidence when NLP detects nothing and drops only deleted experiences',
    (source, status) => {
      const current = row(source, status);
      expect(planSkillReconciliation([current], [], live).deleteIds).toEqual(
        [],
      );
      expect(planSkillReconciliation([current], [], live).updates).toEqual([]);
      const remaining = planSkillReconciliation(
        [current],
        [],
        new Set(['work-experience:exp-b']),
      );
      expect(remaining.deleteIds).toEqual([]);
      expect(remaining.updates[0]?.evidenceRefs).toEqual([other]);
      const gone = planSkillReconciliation([current], [], new Set());
      expect(gone.deleteIds).toEqual(source === 'manual' ? [] : ['docker-row']);
      if (source === 'manual')
        expect(gone.updates[0]?.evidenceRefs).toEqual([]);
    },
  );

  it('merges mixed experience formats with newly detected document evidence without duplicates', () => {
    const cv = { type: 'cv' as const, id: 'cv-a' };
    const result = planSkillReconciliation(
      [row()],
      [{ id: 'docker', name: 'Docker', evidenceRefs: [ref, cv] }],
      live,
    );
    expect(result.creates).toEqual([]);
    expect(result.deleteIds).toEqual([]);
    expect(result.updates[0]?.evidenceRefs).toEqual([cv, ref, other]);
  });

  it('loads live sources before applying the plan in the publication transaction', async () => {
    const current = row();
    const context = {} as TransactionContext;
    const sources = {
      load: vi
        .fn()
        .mockResolvedValue({ live, written: live, approved: new Set() }),
    };
    const repository = {
      findProfileSkillRows: vi.fn().mockResolvedValue([current]),
      applyReconciliation: vi.fn().mockImplementation(() => {
        expect(sources.load).toHaveBeenCalledWith('user', context);
      }),
      applyAutomaticDecisions: vi.fn().mockResolvedValue(1),
    };
    const service = new SkillAnalysisService(
      repository as unknown as SkillAnalysisRepository,
      sources as unknown as SkillEvidenceSourcesService,
      {} as UsersService,
    );
    await service.reconcileDetected('user', [], context);
    expect(repository.applyReconciliation).toHaveBeenCalledWith(
      'user',
      {
        creates: [],
        updates: [],
        deleteIds: [],
      },
      context,
    );
    expect(sources.load).toHaveBeenCalledTimes(1);
    expect(repository.applyAutomaticDecisions).toHaveBeenCalledWith(
      'user',
      ['docker-row'],
      [],
      context,
    );
  });

  it('does not restore an association removed by Matching while the experience still exists', async () => {
    const current = row();
    const unrelated = { type: 'cv', id: 'cv-a', metadata: 'preserved' };
    current.evidenceRefs = ['work_experience:exp-a', ref, other, unrelated];
    const userSkill = {
      findMany: vi.fn().mockResolvedValue([current]),
      delete: vi.fn(),
      update: vi.fn().mockImplementation(({ data }) => {
        current.evidenceRefs = data.evidenceRefs;
      }),
    };
    const prisma = {
      $transaction: vi.fn((callback) => callback({ userSkill })),
    };
    const matching = new UserSkillEvidenceRepository(
      prisma as unknown as PrismaService,
    );
    await matching.replaceDetected('user', 'exp-a', []);
    expect(current.evidenceRefs).toEqual([other, unrelated]);
    expect(userSkill.delete).not.toHaveBeenCalled();
    const plan = planSkillReconciliation([current], [], live);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.updates[0]?.evidenceRefs).toEqual([other]);
  });

  it('normalizes legacy and structured references through the same reader', () => {
    expect(
      parseEvidenceRefs([
        'work_experience:exp-a',
        ref,
        null,
        { type: 'cv', id: 'cv-a' },
        'work_experience:',
        { type: 'other', id: 'x' },
      ]),
    ).toEqual([{ type: 'cv', id: 'cv-a' }, ref]);
  });
});
