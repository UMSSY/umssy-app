import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';

function build() {
  const tx = {
    accessRequest: { update: vi.fn().mockResolvedValue({ id: 'req-1' }) },
    documentValidation: { update: vi.fn().mockResolvedValue({}) },
  };
  const prisma = { $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)) };
  const repository = new DocumentValidationRepository(prisma as never);
  const record = vi.fn().mockResolvedValue(undefined);
  return { repository, tx, record };
}

describe('DocumentValidationRepository: seguridad de la lectura OCR', () => {
  it('marca el fallo como revisión manual y registra el evento en la misma transacción', async () => {
    const { repository, tx, record } = build();
    await expect(repository.markOcrFailed('req-1', 'file-new', new Date(), record)).resolves.toBe(true);
    expect(tx.accessRequest.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ documentFileId: 'file-new' }),
    }));
    expect(tx.documentValidation.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ result: 'manual_review', matchScore: null, readAt: null }),
    }));
    expect(record).toHaveBeenCalledWith({ id: 'req-1' }, tx);
  });

  it('no marca como fallido un archivo que ya fue sustituido', async () => {
    const { repository, tx, record } = build();
    tx.accessRequest.update.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('stale', { code: 'P2025', clientVersion: 'test' }));
    await expect(repository.markOcrFailed('req-1', 'file-old', new Date(), record)).resolves.toBe(false);
    expect(tx.documentValidation.update).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('impide guardar una lectura correspondiente a un archivo anterior', async () => {
    const { repository, tx, record } = build();
    const stale = new Prisma.PrismaClientKnownRequestError('stale', { code: 'P2025', clientVersion: 'test' });
    tx.accessRequest.update.mockRejectedValueOnce(stale);
    await expect(repository.saveEvaluation({
      accessRequestId: 'req-1', result: 'auto_approved', matchScore: 95, reason: null,
      fields: [], decide: true, now: new Date(), expectedDocumentFileId: 'file-old',
    }, record)).rejects.toBe(stale);
    expect(tx.documentValidation.update).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });
});
