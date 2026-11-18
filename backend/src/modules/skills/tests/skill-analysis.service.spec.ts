import type { UsersService } from '../../users/services/users.service.js';
import type { SkillEvidenceSourcesService } from '../services/skill-evidence-sources.service.js';
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
    applyAutomaticDecisions: vi.fn(),
  };
  const sources = { load: vi.fn() };
  const service = new SkillAnalysisService(
    repository as unknown as SkillAnalysisRepository,
    sources as unknown as SkillEvidenceSourcesService,
    {} as UsersService,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    sources.load.mockResolvedValue({
      live: new Set(),
      written: new Set(),
      approved: new Set(),
    });
    repository.findProfileSkillRows.mockResolvedValue([]);
    repository.applyAutomaticDecisions.mockResolvedValue(0);
  });

  it('reconciles manual evidence, removes unsupported detections and preserves approved skills', async () => {
    const evidenceRefs = [{ type: 'education' as const, id: 'e1' }];

    repository.findProfileSkillRows.mockResolvedValue([
      {
        id: 'manual-row',
        skillId: 'manual',
        source: 'manual',
        verificationStatus: 'pending',
        isHighRelevance: true,
        evidenceRefs: [],
        skill: { name: 'Python', areaId: null },
      },
      {
        id: 'obsolete-row',
        skillId: 'obsolete',
        source: 'nlp',
        verificationStatus: 'pending',
        isHighRelevance: true,
        evidenceRefs: [],
        skill: { name: 'Java', areaId: null },
      },
      {
        id: 'approved-row',
        skillId: 'approved',
        source: 'nlp',
        verificationStatus: 'approved',
        isHighRelevance: true,
        evidenceRefs: [],
        skill: { name: 'React', areaId: null },
      },
    ]);

    await expect(
      service.reconcileDetected(
        userId,
        [
          { id: 'manual', name: 'Python', evidenceRefs },
          { id: 'new', name: 'TypeScript', evidenceRefs },
        ],
        context,
      ),
    ).resolves.toBe(true);

    expect(repository.findProfileSkillRows).toHaveBeenCalledWith(
      userId,
      context,
    );
    expect(repository.applyReconciliation).toHaveBeenCalledWith(
      userId,
      {
        creates: [{ skillId: 'new', evidenceRefs }],
        updates: [
          { id: 'manual-row', evidenceRefs, isHighRelevance: true },
          { id: 'approved-row', evidenceRefs: [], isHighRelevance: false },
        ],
        deleteIds: ['obsolete-row'],
      },
      context,
    );
  });

  it('reports no change for an identical detection', async () => {
    const evidenceRefs = [{ type: 'education' as const, id: 'e1' }];
    repository.findProfileSkillRows.mockResolvedValue([
      {
        id: 'row',
        skillId: 's1',
        source: 'nlp',
        verificationStatus: 'pending',
        isHighRelevance: true,
        evidenceRefs,
      },
    ]);

    await expect(
      service.reconcileDetected(
        userId,
        [{ id: 's1', name: 'Python', evidenceRefs }],
        context,
      ),
    ).resolves.toBe(false);
  });

  it('propagates write failures so the publishing transaction rolls back', async () => {
    repository.applyReconciliation.mockRejectedValue(new Error('write failed'));

    await expect(
      service.reconcileDetected(userId, [], context),
    ).rejects.toThrow('write failed');
  });
  it('no cuenta habilidades pendientes cuyo único documento fue eliminado', async () => {
    repository.findProfileSkillRows.mockResolvedValue([
      {
        id: 'orphan',
        source: 'nlp',
        verificationStatus: 'pending',
        evidenceRefs: [{ type: 'cv', id: 'deleted' }],
      },
      {
        id: 'live',
        source: 'nlp',
        verificationStatus: 'pending',
        evidenceRefs: [{ type: 'cv', id: 'current' }],
      },
      {
        id: 'manual',
        source: 'manual',
        verificationStatus: 'pending',
        evidenceRefs: [],
      },
    ]);
    sources.load.mockResolvedValue({
      live: new Set(['cv:current']),
      written: new Set(),
      approved: new Set(),
    });
    await expect(service.countPendingPublicationSkills(userId)).resolves.toBe(
      2,
    );
  });
  it('retira aprobación automática sin respaldo pero conserva decisiones administrativas', async () => {
    const rows = ['auto', 'admin'].map((id) => ({
      id,
      skillId: id,
      source: 'nlp',
      verificationStatus: 'approved',
      radarAutoVerified: id === 'auto',
      isHighRelevance: true,
      evidenceRefs: [{ type: 'cv', id: 'gone' }],
    }));
    repository.findProfileSkillRows.mockResolvedValue(rows);
    await service.reconcileDetected(userId, [], context);
    expect(repository.applyAutomaticDecisions).toHaveBeenCalledWith(
      userId,
      [],
      ['auto'],
      context,
    );
  });
  it('aprueba texto escrito y evidencia documental verificada usando el mismo contexto', async () => {
    repository.findProfileSkillRows.mockResolvedValue([
      {
        id: 'written',
        skillId: 's1',
        source: 'nlp',
        verificationStatus: 'rejected',
        evidenceRefs: [{ type: 'education', id: 'e1' }],
      },
      {
        id: 'document',
        skillId: 's2',
        source: 'nlp',
        verificationStatus: 'pending',
        evidenceRefs: [{ type: 'cv', id: 'c1' }],
      },
      {
        id: 'unverified',
        skillId: 's3',
        source: 'nlp',
        verificationStatus: 'pending',
        evidenceRefs: [{ type: 'cv', id: 'c2' }],
      },
    ]);
    sources.load.mockResolvedValue({
      live: new Set(),
      written: new Set(['education:e1']),
      approved: new Set(['cv:c1:s2']),
    });
    await service.reconcileDetected(userId, [], context);
    expect(sources.load).toHaveBeenCalledWith(userId, context);
    expect(repository.applyAutomaticDecisions).toHaveBeenCalledWith(
      userId,
      ['written', 'document'],
      [],
      context,
    );
  });
});
