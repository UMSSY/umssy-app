import type { DocumentReviewService } from '../services/document-review.service.js';
import { createHash } from 'node:crypto';
import type { TransactionService } from '../../../common/prisma/transaction.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { describe, expect, it, vi } from 'vitest';
import { DocumentReviewDecisionService } from '../services/document-review-decision.service.js';
import type { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import type { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import type { RadarAccessRepository } from '../repositories/radar-access.repository.js';

const admin = '33333333-3333-4333-8333-333333333333';
const otherAdmin = '44444444-4444-4444-8444-444444444444';
const owner = '11111111-1111-4111-8111-111111111111';
const documentId = '22222222-2222-4222-8222-222222222222';
const operationId = '55555555-5555-4555-8555-555555555555';

function hashFor(decision: 'approved' | 'rejected') {
  return createHash('sha256')
    .update(JSON.stringify({ kind: 'cv', targetId: documentId, decision }))
    .digest('hex');
}

function setup() {
  const documents = {
    decide: vi.fn().mockResolvedValue([{ userId: owner }]),
  };
  const reviews = {
    lockReviewOperation: vi.fn().mockResolvedValue(undefined),
    findReviewOperation: vi.fn().mockResolvedValue([]),
    saveReviewOperationResult: vi.fn().mockResolvedValue(1),
  };
  const access = {
    recordAudit: vi.fn().mockResolvedValue(undefined),
  };
  const transactions = {
    run: vi.fn((operation: (context: TransactionContext) => Promise<unknown>) =>
      operation({ client: {} } as TransactionContext),
    ),
  };

  const service = new DocumentReviewDecisionService(
    documents as unknown as DocumentVerificationRepository,
    reviews as unknown as RadarReviewRepository,
    access as unknown as RadarAccessRepository,
    transactions as unknown as TransactionService,
    { revise: vi.fn() } as unknown as DocumentReviewService,
  );

  return { service, documents, reviews, access };
}

describe('Decisiones administrativas de documentos CV', () => {
  it.each([
    ['approved', true],
    ['rejected', false],
  ] as const)(
    'registra correctamente la decisión %s',
    async (decision, approved) => {
      const { service, documents, reviews, access } = setup();

      const result = await service.decide(
        admin,
        documentId,
        operationId,
        decision,
      );

      expect(result).toMatchObject({
        operationId,
        status: 'completed',
        kind: 'cv',
        targetId: documentId,
        decision,
        changed: true,
        userId: owner,
      });

      expect(documents.decide).toHaveBeenCalledWith(
        admin,
        documentId,
        approved,
        expect.objectContaining({ client: expect.any(Object) }),
      );

      expect(access.recordAudit).toHaveBeenCalledWith(
        owner,
        admin,
        `cv.${decision}`,
        documentId,
        { operationId },
        expect.objectContaining({ client: expect.any(Object) }),
      );

      expect(reviews.saveReviewOperationResult).toHaveBeenCalledWith(
        owner,
        admin,
        operationId,
        'document-review',
        'cv',
        documentId,
        hashFor(decision),
        expect.objectContaining({ status: 'completed', decision }),
        expect.objectContaining({ client: expect.any(Object) }),
      );
    },
  );

  describe('consulta de estado de operaciones', () => {
    it('devuelve el resultado guardado de una operación del mismo administrador', async () => {
      const { service, reviews } = setup();
      const response = {
        operationId,
        status: 'completed',
        kind: 'cv',
        targetId: documentId,
        decision: 'approved',
      };

      reviews.findReviewOperation.mockResolvedValue([
        {
          admin_id: admin,
          flow: 'document-review',
          kind: 'cv',
          target_id: documentId,
          payload_hash: hashFor('approved'),
          response_data: response,
        },
      ]);

      await expect(
        service.operationStatus(admin, operationId),
      ).resolves.toEqual(response);

      expect(reviews.lockReviewOperation).toHaveBeenCalledWith(
        operationId,
        expect.objectContaining({ client: expect.any(Object) }),
      );
    });

    it('devuelve 404 cuando la operación no existe', async () => {
      const { service } = setup();

      await expect(service.operationStatus(admin, operationId)).rejects.toThrow(
        'Operacion no encontrada',
      );
    });

    it('no permite consultar operaciones de otro administrador', async () => {
      const { service, reviews } = setup();

      reviews.findReviewOperation.mockResolvedValue([
        {
          admin_id: otherAdmin,
          flow: 'document-review',
          kind: 'cv',
          target_id: documentId,
          payload_hash: hashFor('approved'),
          response_data: { status: 'completed' },
        },
      ]);

      await expect(service.operationStatus(admin, operationId)).rejects.toThrow(
        'Operacion no encontrada',
      );
    });

    it('no permite recuperar operaciones del flujo radar-review', async () => {
      const { service, reviews } = setup();

      reviews.findReviewOperation.mockResolvedValue([
        {
          admin_id: admin,
          flow: 'radar-review',
          kind: 'cv',
          target_id: documentId,
          payload_hash: hashFor('approved'),
          response_data: { status: 'completed' },
        },
      ]);

      await expect(service.operationStatus(admin, operationId)).rejects.toThrow(
        'Operacion no encontrada',
      );
    });
  });

  it('recupera una operación repetida sin duplicar la decisión ni la auditoría', async () => {
    const { service, documents, reviews, access } = setup();
    const response = {
      operationId,
      status: 'completed',
      kind: 'cv',
      targetId: documentId,
      decision: 'approved',
      changed: true,
      userId: owner,
      completedAt: '2026-11-15T00:00:00.000Z',
    };

    reviews.findReviewOperation.mockResolvedValue([
      {
        admin_id: admin,
        flow: 'document-review',
        kind: 'cv',
        target_id: documentId,
        payload_hash: hashFor('approved'),
        response_data: response,
      },
    ]);

    await expect(
      service.decide(admin, documentId, operationId, 'approved'),
    ).resolves.toEqual(response);

    expect(documents.decide).not.toHaveBeenCalled();
    expect(access.recordAudit).not.toHaveBeenCalled();
    expect(reviews.saveReviewOperationResult).not.toHaveBeenCalled();
  });

  it('rechaza reutilizar el operationId con una decisión diferente', async () => {
    const { service, documents, reviews, access } = setup();

    reviews.findReviewOperation.mockResolvedValue([
      {
        admin_id: admin,
        flow: 'document-review',
        kind: 'cv',
        target_id: documentId,
        payload_hash: hashFor('approved'),
        response_data: { status: 'completed' },
      },
    ]);

    await expect(
      service.decide(admin, documentId, operationId, 'rejected'),
    ).rejects.toThrow(
      'El identificador de operacion ya fue utilizado con otros datos',
    );

    expect(documents.decide).not.toHaveBeenCalled();
    expect(access.recordAudit).not.toHaveBeenCalled();
  });

  it('impide recuperar una operación perteneciente a otro administrador', async () => {
    const { service, documents, reviews, access } = setup();

    reviews.findReviewOperation.mockResolvedValue([
      {
        admin_id: otherAdmin,
        flow: 'document-review',
        kind: 'cv',
        target_id: documentId,
        payload_hash: hashFor('approved'),
        response_data: { status: 'completed' },
      },
    ]);

    await expect(
      service.decide(admin, documentId, operationId, 'approved'),
    ).rejects.toThrow('Operacion no encontrada');

    expect(documents.decide).not.toHaveBeenCalled();
    expect(access.recordAudit).not.toHaveBeenCalled();
  });

  it('no guarda auditoría ni resultado cuando el documento ya cambió', async () => {
    const { service, documents, reviews, access } = setup();

    documents.decide.mockResolvedValue([]);

    await expect(
      service.decide(admin, documentId, operationId, 'approved'),
    ).rejects.toMatchObject({ code: 'DOCUMENT_VERIFICATION_CONFLICT' });

    expect(access.recordAudit).not.toHaveBeenCalled();
    expect(reviews.saveReviewOperationResult).not.toHaveBeenCalled();
  });
});
