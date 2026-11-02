import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { ACCESS_REQUEST_AUDIT_SELECT } from '../constants/access-request-audit-select.constants.js';
import { buildValidationWhere } from '../helpers/build-validation-where.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';

const FIELDS = [{ field: 'fullName' as const, read: 'María', result: 'match' as const }];

function build() {
  const tx = {
    documentValidation: { update: vi.fn().mockResolvedValue({}) },
    accessRequest: { update: vi.fn().mockResolvedValue({ id: 'req-1' }), findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'req-1' }) },
    activationOtp: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
  };
  const prisma = {
    $transaction: vi.fn((operation: (client: unknown) => unknown) => operation(tx)),
    documentValidation: { upsert: vi.fn().mockResolvedValue({ id: 'val-1' }) },
    accessRequest: { findUnique: vi.fn().mockResolvedValue(null), count: vi.fn().mockResolvedValue(3) },
  };
  return { tx, prisma, repository: new DocumentValidationRepository(prisma as any) };
}

const NOW = new Date('2026-10-24T15:00:00Z');

describe('DocumentValidationRepository', () => {
  it('CA9: queue deja la solicitud en cola de lectura y limpia una lectura anterior', async () => {
    const { prisma, repository } = build();
    const tx = { documentValidation: { upsert: vi.fn().mockResolvedValue({ id: 'val-1' }) } };

    await repository.queue('req-1', tx as any);

    const args = tx.documentValidation.upsert.mock.calls[0][0];
    expect(args.create).toEqual({ accessRequestId: 'req-1', result: 'queued' });
    expect(args.update).toMatchObject({ result: 'queued', matchScore: null, reason: null, fieldResults: Prisma.DbNull, readAt: null });
    expect(prisma.documentValidation.upsert).not.toHaveBeenCalled();
  });

  it('saveEvaluation con dictamen aprueba solo si la solicitud sigue pendiente y ejecuta el registro en la transacción', async () => {
    const { tx, repository } = build();
    const hook = vi.fn().mockResolvedValue(undefined);

    const saved = await repository.saveEvaluation(
      { accessRequestId: 'req-1', result: 'auto_approved', matchScore: 98, reason: null, fields: FIELDS, decide: true, now: NOW },
      hook,
    );

    expect(tx.documentValidation.update).toHaveBeenCalledWith({
      where: { accessRequestId: 'req-1' },
      data: { result: 'auto_approved', matchScore: 98, reason: null, fieldResults: FIELDS, readAt: NOW },
    });
    expect(tx.accessRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1', status: { title: 'pending' } },
      data: { status: { connect: { title: 'approved' } }, reviewedAt: NOW },
      select: ACCESS_REQUEST_AUDIT_SELECT,
    });
    expect(hook).toHaveBeenCalledWith({ id: 'req-1' }, tx);
    expect(saved).toEqual({ decided: true, source: { id: 'req-1' } });
  });

  it('saveEvaluation de un rechazo guarda el motivo en la solicitud', async () => {
    const { tx, repository } = build();

    await repository.saveEvaluation(
      { accessRequestId: 'req-1', result: 'auto_rejected', matchScore: 12, reason: 'El archivo no es un diploma', fields: FIELDS, decide: true, now: NOW },
      vi.fn(),
    );

    expect(tx.accessRequest.update.mock.calls[0][0].data).toEqual({
      status: { connect: { title: 'rejected' } },
      reviewedAt: NOW,
      rejectionReason: 'El archivo no es un diploma',
    });
  });

  it('saveEvaluation en revisión manual o sin dictamen no cambia el estado de la solicitud', async () => {
    const { tx, repository } = build();

    const saved = await repository.saveEvaluation(
      { accessRequestId: 'req-1', result: 'manual_review', matchScore: 61, reason: 'El apellido no coincide', fields: FIELDS, decide: true, now: NOW },
      vi.fn(),
    );

    expect(tx.accessRequest.update).not.toHaveBeenCalled();
    expect(tx.accessRequest.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'req-1' }, select: ACCESS_REQUEST_AUDIT_SELECT });
    expect(saved.decided).toBe(false);
  });

  it('CA7: revertApproval vuelve a revisión, asigna al administrativo, anula códigos sin usar y registra el evento', async () => {
    const { tx, repository } = build();
    const hook = vi.fn().mockResolvedValue(undefined);

    await repository.revertApproval('req-1', 'admin-1', NOW, hook);

    expect(tx.accessRequest.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'req-1', status: { title: 'approved' } },
      data: { status: { connect: { title: 'in_review' } }, reviewedBy: { connect: { id: 'admin-1' } }, reviewedAt: NOW },
    });
    expect(tx.documentValidation.update.mock.calls[0][0].data).toMatchObject({
      result: 'manual_review',
      reason: 'Aprobación automática revertida por el administrador',
      revertedAt: NOW,
      revertedBy: { connect: { id: 'admin-1' } },
    });
    expect(tx.activationOtp.deleteMany).toHaveBeenCalledWith({ where: { accessRequestId: 'req-1', usedAt: null } });
    expect(hook).toHaveBeenCalledWith({ id: 'req-1' }, tx);
  });

  it('CA10: los contadores filtran por estado, resultado y fecha', async () => {
    const { prisma, repository } = build();
    const since = new Date('2026-10-24T04:00:00Z');

    await repository.countManualReview();
    await repository.countAutomaticDecisions('auto_approved', since);
    await repository.countReceivedSince(since);

    expect(prisma.accessRequest.count.mock.calls[0][0].where).toEqual({
      status: { title: { in: ['pending', 'in_review'] } },
      OR: [{ documentValidation: { is: { result: 'manual_review' } } }, { documentValidation: { is: null } }],
    });
    expect(prisma.accessRequest.count.mock.calls[1][0].where).toEqual({
      status: { title: 'approved' },
      reviewedAt: { gte: since },
      documentValidation: { is: { result: 'auto_approved' } },
    });
    expect(prisma.accessRequest.count.mock.calls[2][0].where).toEqual({ submittedAt: { gte: since } });
  });

  it('findAutomationState lee lo necesario para decidir, sin el archivo', async () => {
    const { prisma, repository } = build();
    await repository.findAutomationState('req-1');
    const args = prisma.accessRequest.findUnique.mock.calls[0][0];
    expect(args.where).toEqual({ id: 'req-1' });
    expect(args.select.activationOtps).toEqual({ where: { usedAt: { not: null } }, select: { id: true }, take: 1 });
    expect(JSON.stringify(args.select)).not.toContain('content');
  });
});

describe('buildValidationWhere', () => {
  it('CA12: filtra por el tipo de dictamen; revisión manual incluye solicitudes sin lectura', () => {
    expect(buildValidationWhere('auto_approved')).toEqual({ documentValidation: { is: { result: 'auto_approved' } } });
    expect(buildValidationWhere('queued')).toEqual({ documentValidation: { is: { result: 'queued' } } });
    expect(buildValidationWhere('manual_review')).toEqual({
      OR: [{ documentValidation: { is: { result: 'manual_review' } } }, { documentValidation: { is: null } }],
    });
  });
});
