import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { CertificationsRepository } from '../../certifications/repositories/certifications.repository.js';
import type { RadarEvidenceSourcesRepository } from '../../radar-integration/radar-evidence-sources.repository.js';
import type { ProfileRepository } from '../../profile/repositories/profile.repository.js';
import type { WorkExperienceRepository } from '../../work-experience/repositories/work-experience.repository.js';
import type { EducationsRepository } from '../../educations/repositories/educations.repository.js';
import type { SkillRepository } from '../../skills/repositories/skill.repository.js';
import type { UserSkillRepository } from '../../skills/repositories/user-skill.repository.js';
import {
  ProfileSkillResultsRepository,
  processingStateSelect,
} from '../repositories/profile-skill-results.repository.js';
import { ProfileSkillSourcesRepository } from '../repositories/profile-skill-sources.repository.js';
import type { NlpDetectedSkill } from '../types/nlp-detected-skill.type.js';

const userId = '11111111-1111-4111-8111-111111111111';
const now = new Date('2026-10-23T12:00:00.000Z');

describe('ProfileSkillSourcesRepository', () => {
  const prisma = {
    findCurrentCvText: vi.fn(),
    findManyByUserId: vi.fn(),
  };
  const profileRepository = { userExists: vi.fn() };
  const workExperienceRepository = { findTextSources: vi.fn() };
  const educationsRepository = { findTextSources: vi.fn() };
  const skillRepository = { findNlpCatalog: vi.fn() };

  const repository = new ProfileSkillSourcesRepository(
    profileRepository as unknown as ProfileRepository,
    workExperienceRepository as unknown as WorkExperienceRepository,
    educationsRepository as unknown as EducationsRepository,
    skillRepository as unknown as SkillRepository,
    prisma as unknown as CertificationsRepository,
    prisma as unknown as RadarEvidenceSourcesRepository,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.findCurrentCvText.mockResolvedValue([]);
    prisma.findManyByUserId.mockResolvedValue([]);
  });

  it('checks that the user exists', async () => {
    profileRepository.userExists.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(repository.userExists(userId)).resolves.toBe(true);
    await expect(repository.userExists(userId)).resolves.toBe(false);
    expect(profileRepository.userExists).toHaveBeenCalledWith(userId);
  });

  it('reads the texts of the owner without company or institution names', async () => {
    workExperienceRepository.findTextSources.mockResolvedValue([
      { id: 'w1', type: 'work-experience', text: 'Desarrollador backend.\nAPIs con Node.js' },
      { id: 'w2', type: 'work-experience', text: 'Analista' },
    ]);
    educationsRepository.findTextSources.mockResolvedValue([
      { id: 'e1', type: 'education', text: 'Ingeniería de Sistemas' },
    ]);

    await expect(repository.findTextSources(userId)).resolves.toEqual([
      { id: 'w1', type: 'work-experience', text: 'Desarrollador backend.\nAPIs con Node.js' },
      { id: 'w2', type: 'work-experience', text: 'Analista' },
      { id: 'e1', type: 'education', text: 'Ingeniería de Sistemas' },
    ]);
    expect(workExperienceRepository.findTextSources).toHaveBeenCalledWith(userId);
    expect(educationsRepository.findTextSources).toHaveBeenCalledWith(userId);
  });

  it('reads only the official catalog', async () => {
    skillRepository.findNlpCatalog.mockResolvedValue([]);
    await repository.findCatalog();
    expect(skillRepository.findNlpCatalog).toHaveBeenCalledOnce();
  });
});

describe('ProfileSkillResultsRepository', () => {
  const state = { userId, status: 'ready', inputRevision: 2, processedRevision: 2, resultVersion: 3, updatedAt: now, dictionaryVersion: '1.0.0' };
  let tx: {
    profileSkillProcessingState: { updateMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  };
  let prisma: Record<string, unknown> & {
    profileSkillProcessingState: Record<string, ReturnType<typeof vi.fn>>;
  };
  let userSkillRepository: {
    findProfileSkillRows: ReturnType<typeof vi.fn>;
    applyReconciliationPlan: ReturnType<typeof vi.fn>;
  };
  let repository: ProfileSkillResultsRepository;

  const detected: NlpDetectedSkill[] = [
    { id: 'skill-new', name: 'Docker', source: 'nlp', verificationStatus: 'pending', evidenceRefs: [{ type: 'work-experience', id: 'w1' }] },
    { id: 'skill-manual', name: 'Python', source: 'nlp', verificationStatus: 'pending', evidenceRefs: [{ type: 'education', id: 'e1' }] },
  ];

  beforeEach(() => {
    tx = {
      profileSkillProcessingState: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({ processedRevision: 1 }),
        update: vi.fn().mockResolvedValue(state),
      },
    };
    prisma = {
      profileSkillProcessingState: {
        findUnique: vi.fn().mockResolvedValue(state),
        upsert: vi.fn().mockResolvedValue(state),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: vi.fn((operation: (client: typeof tx) => unknown) => operation(tx)),
    };
    userSkillRepository = {
      findProfileSkillRows: vi.fn().mockResolvedValue([
        { id: 'row-manual', skillId: 'skill-manual', source: 'manual', verificationStatus: 'pending', isHighRelevance: false, evidenceRefs: [], skill: { name: 'Python', areaId: null } },
        { id: 'row-old', skillId: 'skill-old', source: 'nlp', verificationStatus: 'pending', isHighRelevance: true, evidenceRefs: [{ type: 'education', id: 'e9' }], skill: { name: 'Java', areaId: null } },
      ]),
      applyReconciliationPlan: vi.fn(),
    };
    repository = new ProfileSkillResultsRepository(
      prisma as unknown as PrismaService,
      userSkillRepository as unknown as UserSkillRepository,
    );
  });

  it('reads the state and the skill rows of the user', async () => {
    await expect(repository.findState(userId)).resolves.toBe(state);
    await repository.findProfileSkillRows(userId);

    expect(prisma.profileSkillProcessingState.findUnique).toHaveBeenCalledWith({ where: { userId }, select: processingStateSelect });
    expect(userSkillRepository.findProfileSkillRows).toHaveBeenCalledWith(userId);
  });

  it('registers each source change as a new pending revision', async () => {
    await repository.registerSourceChange(userId, now);

    expect(prisma.profileSkillProcessingState.upsert).toHaveBeenCalledWith({
      where: { userId },
      create: { userId, status: 'pending', inputRevision: 1, updatedAt: now },
      update: { status: 'pending', inputRevision: { increment: 1 }, updatedAt: now },
      select: processingStateSelect,
    });
  });

  it('retries once when another first change created the state at the same time', async () => {
    prisma.profileSkillProcessingState.upsert
      .mockRejectedValueOnce(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }))
      .mockResolvedValueOnce(state);

    await expect(repository.registerSourceChange(userId, now)).resolves.toBe(state);
    expect(prisma.profileSkillProcessingState.upsert).toHaveBeenCalledTimes(2);
  });

  it('does not retry other errors', async () => {
    prisma.profileSkillProcessingState.upsert.mockRejectedValueOnce(Object.assign(new Error('down'), { code: 'P1001' }));

    await expect(repository.registerSourceChange(userId, now)).rejects.toMatchObject({ code: 'P1001' });
    expect(prisma.profileSkillProcessingState.upsert).toHaveBeenCalledOnce();
  });

  it('creates the state without a new revision when only reading it for a manual run', async () => {
    await repository.ensureState(userId, now);

    expect(prisma.profileSkillProcessingState.upsert).toHaveBeenCalledWith({
      where: { userId },
      create: { userId, status: 'pending', inputRevision: 0, updatedAt: now },
      update: {},
      select: processingStateSelect,
    });
  });

  it('marks the error only for the revision that failed', async () => {
    await repository.markError(userId, 4, now);

    expect(prisma.profileSkillProcessingState.updateMany).toHaveBeenCalledWith({
      where: { userId, inputRevision: 4 },
      data: { status: 'error', updatedAt: now },
    });
  });

  it('publishes the reconciliation and the new version in one transaction', async () => {
    await expect(repository.publish(userId, 2, detected, '1.0.0', now)).resolves.toEqual({ state, changed: true });

    expect(tx.profileSkillProcessingState.updateMany).toHaveBeenCalledWith({
      where: { userId, inputRevision: 2 },
      data: { updatedAt: now },
    });
    expect(userSkillRepository.findProfileSkillRows).toHaveBeenCalledWith(userId, tx);
    expect(userSkillRepository.applyReconciliationPlan).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        deleteIds: ['row-old'],
        updates: [{ id: 'row-manual', evidenceRefs: [{ type: 'education', id: 'e1' }], isHighRelevance: true }],
        creates: [{ skillId: 'skill-new', evidenceRefs: [{ type: 'work-experience', id: 'w1' }] }],
      }),
      tx,
    );
    expect(tx.profileSkillProcessingState.update).toHaveBeenCalledWith({
      where: { userId },
      data: {
        status: 'ready',
        processedRevision: 2,
        dictionaryVersion: '1.0.0',
        updatedAt: now,
        resultVersion: { increment: 1 },
      },
      select: processingStateSelect,
    });
  });

  it('keeps the version when nothing changed after the first result', async () => {
    userSkillRepository.findProfileSkillRows.mockResolvedValue([]);

    await expect(repository.publish(userId, 2, [], '1.0.0', now)).resolves.toEqual({ state, changed: false });

    expect(userSkillRepository.applyReconciliationPlan).toHaveBeenCalledWith(
      userId,
      { deleteIds: [], updates: [], creates: [] },
      tx,
    );
    expect(tx.profileSkillProcessingState.update.mock.calls[0][0].data).not.toHaveProperty('resultVersion');
  });

  it('gives the first result its own version even without changes', async () => {
    userSkillRepository.findProfileSkillRows.mockResolvedValue([]);
    tx.profileSkillProcessingState.findUnique.mockResolvedValue({ processedRevision: null });

    await repository.publish(userId, 1, [], '1.0.0', now);

    expect(tx.profileSkillProcessingState.update.mock.calls[0][0].data).toMatchObject({ resultVersion: { increment: 1 } });
  });

  it('does not write anything for a stale revision', async () => {
    tx.profileSkillProcessingState.updateMany.mockResolvedValue({ count: 0 });

    await expect(repository.publish(userId, 1, detected, '1.0.0', now)).resolves.toBeNull();

    expect(userSkillRepository.findProfileSkillRows).not.toHaveBeenCalled();
    expect(tx.profileSkillProcessingState.update).not.toHaveBeenCalled();
  });
});

