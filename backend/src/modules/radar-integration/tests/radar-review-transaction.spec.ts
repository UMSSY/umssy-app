import { createHash } from 'node:crypto';
import type { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { describe, expect, it, vi } from 'vitest';
import { RadarReviewService } from '../services/radar-review.service.js';
import { RadarReviewMapper } from '../mappers/radar-review.mapper.js';
import type { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import type { RadarAccessRepository } from '../repositories/radar-access.repository.js';
import type { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import type { RadarPublicationService } from '../services/radar-publication.service.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

function setup() {
  const client = {} as TransactionContext['client'];
  const repository = {
    lockReviewOperation: vi.fn().mockResolvedValue(undefined),
    findReviewOperation: vi.fn().mockResolvedValue([]),
    saveReviewOperationResult: vi.fn().mockResolvedValue(1),
    changeCvDecision: vi.fn().mockResolvedValue([{ user_id: 'owner' }]),
    cvOwner: vi.fn().mockResolvedValue([{ user_id: 'owner' }]),
    listReviewQueue: vi.fn().mockResolvedValue([]),
  };
  const skills = {
    skillForDecision: vi.fn().mockResolvedValue({ userId: 'owner' }),
    changeSkillDecision: vi.fn().mockResolvedValue({ count: 1 }),
    listReviewQueue: vi.fn().mockResolvedValue([]),
  };
  const access = { recordAudit: vi.fn() };
  const nlp = { refreshAfterChange: vi.fn() };
  const publication = {
    recalculate: vi.fn(),
    myRadar: vi.fn().mockResolvedValue({ userId: 'owner' }),
  };
  const prisma = {
    $transaction: vi.fn(
      <T>(
        operation: (client: TransactionContext['client']) => Promise<T>,
      ): Promise<T> => operation(client),
    ),
  };
  const service = new RadarReviewService(
    repository as unknown as RadarReviewRepository,
    access as unknown as RadarAccessRepository,
    nlp as unknown as ProfileSkillsAnalysisService,
    publication as unknown as RadarPublicationService,
    new RadarReviewMapper(),
    skills as unknown as SkillAnalysisService,
    new TransactionService(prisma as unknown as PrismaService),
    {} as CvSourcesService,
  );
  return { service, repository, skills, access, nlp, publication, client };
}

describe('Revisión administrativa transaccional', () => {
  it.each(['cv', 'skill'])(
    'comparte la transacción de %s y su auditoría',
    async (kind) => {
      const { service, repository, skills, access, client } = setup();
      await service.decision(
        'admin',
        kind,
        'evidence',
        'approved',
        'operation-1',
      );
      const write =
        kind === 'cv'
          ? repository.changeCvDecision
          : skills.changeSkillDecision;
      expect(write.mock.calls[0].at(-1)).toEqual({ client });
      expect(access.recordAudit).toHaveBeenCalledWith(
        'owner',
        'admin',
        `${kind}.approved`,
        'evidence',
        {},
        { client },
      );
    },
  );

  it.each(['cv', 'skill'])(
    'aborta %s si falla la auditoría, antes de publicar',
    async (kind) => {
      const { service, access, nlp, publication } = setup();
      access.recordAudit.mockRejectedValue(new Error('audit unavailable'));
      await expect(
        service.decision('admin', kind, 'evidence', 'approved', 'operation-1'),
      ).rejects.toThrow('audit unavailable');
      expect(nlp.refreshAfterChange).not.toHaveBeenCalled();
      expect(publication.recalculate).not.toHaveBeenCalled();
    },
  );

  it('recupera una operacion repetida sin duplicar la auditoria', async () => {
    const { service, repository, skills, access } = setup();
    const payloadHash = createHash('sha256')
      .update(
        JSON.stringify({
          kind: 'skill',
          targetId: 'evidence',
          decision: 'approved',
        }),
      )
      .digest('hex');
    repository.findReviewOperation.mockResolvedValue([
      {
        admin_id: 'admin',
        flow: 'radar-review',
        kind: 'skill',
        target_id: 'evidence',
        payload_hash: payloadHash,
        response_data: {
          operationId: 'operation-1',
          status: 'completed',
          kind: 'skill',
          targetId: 'evidence',
          decision: 'approved',
          changed: true,
          userId: 'owner',
          completedAt: '2026-11-15T00:00:00.000Z',
        },
      },
    ]);
    const result = await service.decision(
      'admin',
      'skill',
      'evidence',
      'approved',
      'operation-1',
    );
    expect(result.status).toBe('completed');
    expect(skills.changeSkillDecision).not.toHaveBeenCalled();
    expect(access.recordAudit).not.toHaveBeenCalled();
    expect(repository.saveReviewOperationResult).not.toHaveBeenCalled();
  });

  it('recupera el resultado de una operacion del mismo administrador', async () => {
    const { service, repository, client } = setup();
    const response = {
      operationId: 'operation-1',
      status: 'completed',
      decision: 'approved',
    };

    repository.findReviewOperation.mockResolvedValue([
      {
        admin_id: 'admin',
        flow: 'radar-review',
        kind: 'skill',
        target_id: 'evidence',
        payload_hash: 'hash-diferente',
        response_data: response,
      },
    ]);

    await expect(
      service.operationStatus('admin', 'operation-1'),
    ).resolves.toEqual(response);

    expect(repository.findReviewOperation).toHaveBeenCalledWith('operation-1', {
      client,
    });
  });

  it('rechaza reutilizar el operationId con datos diferentes', async () => {
    const { service, repository, skills, access } = setup();
    repository.findReviewOperation.mockResolvedValue([
      {
        admin_id: 'admin',
        flow: 'radar-review',
        kind: 'skill',
        target_id: 'evidence',
        payload_hash: 'hash-diferente',
        response_data: {
          operationId: 'operation-1',
          status: 'completed',
        },
      },
    ]);

    await expect(
      service.decision('admin', 'skill', 'evidence', 'approved', 'operation-1'),
    ).rejects.toMatchObject({
      code: 'RADAR_REVIEW_OPERATION_CONFLICT',
    });

    expect(skills.changeSkillDecision).not.toHaveBeenCalled();
    expect(access.recordAudit).not.toHaveBeenCalled();
    expect(repository.saveReviewOperationResult).not.toHaveBeenCalled();
  });
  it('no permite consultar una operacion de otro administrador', async () => {
    const { service, repository } = setup();

    repository.findReviewOperation.mockResolvedValue([
      {
        admin_id: 'another-admin',
        flow: 'radar-review',
        kind: 'skill',
        target_id: 'evidence',
        payload_hash: 'hash',
        response_data: { status: 'completed' },
      },
    ]);

    await expect(
      service.operationStatus('admin', 'operation-1'),
    ).rejects.toThrow('Operacion no encontrada');
  });

  it('rechaza consultar una operacion inexistente', async () => {
    const { service, repository } = setup();

    repository.findReviewOperation.mockResolvedValue([]);

    await expect(
      service.operationStatus('admin', 'operation-1'),
    ).rejects.toThrow('Operacion no encontrada');
  });
  it('compone la cola mediante el servicio de habilidades', async () => {
    const { service, skills, repository } = setup();
    expect(await service.queue('admin')).toEqual([]);
    expect(repository.listReviewQueue).toHaveBeenCalledOnce();
    expect(skills.listReviewQueue).toHaveBeenCalledOnce();
  });
});
