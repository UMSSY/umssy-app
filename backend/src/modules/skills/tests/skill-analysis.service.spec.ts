import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import type { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import { SkillAnalysisService } from '../services/skill-analysis.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const context = {} as TransactionContext;

describe('SkillAnalysisService', () => {
  const repository = {
    findCatalog: vi.fn(),
    findProfileSkillRows: vi.fn(),
    applyReconciliation: vi.fn(),
  };
  const service = new SkillAnalysisService(repository as unknown as SkillAnalysisRepository);

  beforeEach(() => {
    vi.resetAllMocks();
    repository.findProfileSkillRows.mockResolvedValue([]);
  });

  it('reconciles manual evidence, removes unsupported detections and preserves approved skills', async () => {
    const row = { verificationStatus: 'pending', isHighRelevance: true, evidenceRefs: [], skill: { name: 'Python', areaId: null } };
    repository.findProfileSkillRows.mockResolvedValue([
      { ...row, id: 'manual-row', skillId: 'manual', source: 'manual' },
      { ...row, id: 'obsolete-row', skillId: 'obsolete', source: 'nlp' },
      { ...row, id: 'approved-row', skillId: 'approved', source: 'nlp', verificationStatus: 'approved' },
    ]);
    const evidenceRefs = [{ type: 'education' as const, id: 'e1' }];

    await expect(service.reconcileDetected(userId, [
      { id: 'manual', evidenceRefs }, { id: 'new', evidenceRefs },
    ], context)).resolves.toBe(true);

    expect(repository.findProfileSkillRows).toHaveBeenCalledWith(userId, context);
    expect(repository.applyReconciliation).toHaveBeenCalledWith(userId, {
      creates: [{ skillId: 'new', evidenceRefs }],
      updates: [
        { id: 'manual-row', evidenceRefs, isHighRelevance: true },
        { id: 'approved-row', evidenceRefs: [], isHighRelevance: false },
      ],
      deleteIds: ['obsolete-row'],
    }, context);
  });

  it('reports no change for an identical detection', async () => {
    const evidenceRefs = [{ type: 'education' as const, id: 'e1' }];
    repository.findProfileSkillRows.mockResolvedValue([
      { id: 'row', skillId: 's1', source: 'nlp', verificationStatus: 'pending', isHighRelevance: true, evidenceRefs },
    ]);

    await expect(service.reconcileDetected(userId, [{ id: 's1', evidenceRefs }], context)).resolves.toBe(false);
  });

  it('propagates write failures so the publishing transaction rolls back', async () => {
    repository.applyReconciliation.mockRejectedValue(new Error('write failed'));

    await expect(service.reconcileDetected(userId, [], context)).rejects.toThrow('write failed');
  });
});
