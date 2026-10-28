import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ProfileSkillResultsRepository, processingStateSelect } from '../repositories/profile-skill-results.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const now = new Date('2026-10-23T12:00:00.000Z');

describe('ProfileSkillResultsRepository', () => {
  const state = { userId, status: 'ready', inputRevision: 2, processedRevision: 2, resultVersion: 3, updatedAt: now, dictionaryVersion: '1.0.0' };
  let reconcileSkills: ReturnType<typeof vi.fn<(context: TransactionContext) => Promise<boolean>>>;
  let tx: {
    profileSkillProcessingState: { updateMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  };
  let prisma: Record<string, unknown> & {
    profileSkillProcessingState: Record<string, ReturnType<typeof vi.fn>>;
  };
  let repository: ProfileSkillResultsRepository;

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
    reconcileSkills = vi.fn().mockResolvedValue(true);
    repository = new ProfileSkillResultsRepository(prisma as unknown as PrismaService);
  });

  it('reads only its processing state', async () => {
    await expect(repository.findState(userId)).resolves.toBe(state);
    expect(prisma.profileSkillProcessingState.findUnique).toHaveBeenCalledWith({ where: { userId }, select: processingStateSelect });
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
    await expect(repository.publish(userId, 2, '1.0.0', now, reconcileSkills)).resolves.toEqual({ state, changed: true });

    expect(tx.profileSkillProcessingState.updateMany).toHaveBeenCalledWith({
      where: { userId, inputRevision: 2 },
      data: { updatedAt: now },
    });
    expect(reconcileSkills).toHaveBeenCalledExactlyOnceWith({ client: tx });
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
    reconcileSkills.mockResolvedValue(false);

    await expect(repository.publish(userId, 2, '1.0.0', now, reconcileSkills)).resolves.toEqual({ state, changed: false });

    expect(tx.profileSkillProcessingState.update.mock.calls[0][0].data).not.toHaveProperty('resultVersion');
  });

  it('gives the first result its own version even without changes', async () => {
    reconcileSkills.mockResolvedValue(false);
    tx.profileSkillProcessingState.findUnique.mockResolvedValue({ processedRevision: null });

    await repository.publish(userId, 1, '1.0.0', now, reconcileSkills);

    expect(tx.profileSkillProcessingState.update.mock.calls[0][0].data).toMatchObject({ resultVersion: { increment: 1 } });
  });

  it('does not write anything for a stale revision', async () => {
    tx.profileSkillProcessingState.updateMany.mockResolvedValue({ count: 0 });

    await expect(repository.publish(userId, 1, '1.0.0', now, reconcileSkills)).resolves.toBeNull();

    expect(reconcileSkills).not.toHaveBeenCalled();
    expect(tx.profileSkillProcessingState.update).not.toHaveBeenCalled();
  });

  it('propagates a reconciliation failure without marking the result ready', async () => {
    reconcileSkills.mockRejectedValue(new Error('skill write failed'));

    await expect(repository.publish(userId, 2, '1.0.0', now, reconcileSkills)).rejects.toThrow('skill write failed');

    expect(tx.profileSkillProcessingState.update).not.toHaveBeenCalled();
  });
});
