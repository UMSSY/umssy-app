import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ActiveAccessRequestExistsException } from '../exceptions/active-access-request-exists.exception.js';
import { DocumentCorrectionConflictException } from '../exceptions/document-correction-conflict.exception.js';
import { DocumentCorrectionRepository } from '../repositories/document-correction.repository.js';
import { DOCUMENT_CORRECTION_SELECT } from '../constants/document-correction-select.constants.js';
import type { ReplaceRejectedDocumentOperation } from '../types/document-correction.types.js';
import { correctedFile, correctionContext, correctionSnapshot } from './document-correction.fixture.js';

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('test database error', { code, clientVersion: 'test' });
}

function build() {
  const accessRequest = { findUnique: vi.fn(), update: vi.fn() };
  accessRequest.update.mockResolvedValueOnce(correctionSnapshot()).mockResolvedValueOnce({ id: 'request-1' });
  const tx = { accessRequest } as unknown as Prisma.TransactionClient;
  const prisma = { accessRequest, $transaction: vi.fn(async (callback: (client: Prisma.TransactionClient) => Promise<unknown>) => callback(tx)) };
  const repository = new DocumentCorrectionRepository(prisma as unknown as PrismaService);
  const createFile = vi.fn(async () => correctedFile());
  const onReplaced = vi.fn(async () => undefined);
  const operation: ReplaceRejectedDocumentOperation = { context: correctionContext(), documentType: 'national_title', createFile, onReplaced };
  return { accessRequest, tx, prisma, repository, operation, createFile, onReplaced };
}

describe('DocumentCorrectionRepository', () => {
  it('consulta la revisión por ID o código sin cambiar el contrato público de B1', async () => {
    const { repository, accessRequest } = build();
    await repository.findById('request-1');
    expect(accessRequest.findUnique).toHaveBeenLastCalledWith({ where: { id: 'request-1' }, select: DOCUMENT_CORRECTION_SELECT });
    await repository.findByCode('SOL-2026-0139');
    expect(accessRequest.findUnique).toHaveBeenLastCalledWith({ where: { requestCode: 'SOL-2026-0139' }, select: DOCUMENT_CORRECTION_SELECT });
  });

  it('reserva rejected y su revisión, guarda el archivo y registra el cambio en la misma transacción', async () => {
    const { repository, accessRequest, tx, prisma, operation, createFile, onReplaced } = build();
    await expect(repository.replaceRejectedDocument(operation)).resolves.toEqual({ requestCode: 'SOL-2026-0139', status: 'pending' });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(accessRequest.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'request-1', requestCode: 'SOL-2026-0139', status: { title: 'rejected' }, AND: [{ documentFileId: 'file-old' }], updatedAt: operation.context.revision },
      data: { status: { connect: { title: 'pending' } } },
    });
    expect(createFile).toHaveBeenCalledWith(tx);
    expect(onReplaced).toHaveBeenCalledWith(correctionSnapshot(), correctedFile(), tx);
    const replacement = accessRequest.update.mock.calls[1][0];
    expect(replacement.where).toEqual({ id: 'request-1' });
    expect(replacement.data).toMatchObject({ documentFile: { connect: { id: 'file-new' } }, documentType: { connect: { title: 'national_title' } }, rejectionReason: null, reviewedAt: null, openedAt: null });
    expect(replacement.data).not.toHaveProperty('requestCode');
    expect(replacement.data).not.toHaveProperty('submittedAt');
    expect(replacement.data).not.toHaveProperty('email');
    expect(createFile.mock.invocationCallOrder[0]).toBeGreaterThan(accessRequest.update.mock.invocationCallOrder[0]);
    expect(onReplaced.mock.invocationCallOrder[0]).toBeGreaterThan(accessRequest.update.mock.invocationCallOrder[1]);
  });

  it('conserva el filtro atómico cuando el documento anterior es nulo', async () => {
    const { repository, accessRequest, operation, onReplaced } = build();
    operation.context.previousFileId = null;
    accessRequest.update.mockReset()
      .mockResolvedValueOnce(correctionSnapshot({ documentFileId: null }))
      .mockResolvedValueOnce({ id: 'request-1' });

    await repository.replaceRejectedDocument(operation);

    expect(accessRequest.update.mock.calls[0][0].where).toMatchObject({
      id: 'request-1', status: { title: 'rejected' },
      AND: [{ documentFileId: null }], updatedAt: operation.context.revision,
    });
    expect(onReplaced).toHaveBeenCalledWith(correctionSnapshot({ documentFileId: null }), correctedFile(), expect.anything());
  });

  it('una revisión obsoleta devuelve conflicto antes de crear otro archivo', async () => {
    const { repository, accessRequest, operation, createFile, onReplaced } = build();
    accessRequest.update.mockReset().mockRejectedValue(prismaError('P2025'));
    await expect(repository.replaceRejectedDocument(operation)).rejects.toBeInstanceOf(DocumentCorrectionConflictException);
    expect(createFile).not.toHaveBeenCalled();
    expect(onReplaced).not.toHaveBeenCalled();
  });

  it('los datos activos duplicados impiden cambiar la solicitud', async () => {
    const { repository, accessRequest, operation, createFile } = build();
    accessRequest.update.mockReset().mockRejectedValue(prismaError('P2002'));
    await expect(repository.replaceRejectedDocument(operation)).rejects.toBeInstanceOf(ActiveAccessRequestExistsException);
    expect(createFile).not.toHaveBeenCalled();
  });

  it('si falla el almacenamiento, rechaza la transacción y no registra auditoría', async () => {
    const { repository, accessRequest, operation, createFile, onReplaced } = build();
    const failure = new Error('storage failed');
    createFile.mockRejectedValue(failure);
    await expect(repository.replaceRejectedDocument(operation)).rejects.toBe(failure);
    expect(accessRequest.update).toHaveBeenCalledTimes(1);
    expect(onReplaced).not.toHaveBeenCalled();
  });

  it('si falla el registro del archivo o su auditoría, propaga el fallo de la transacción', async () => {
    const { repository, operation, onReplaced } = build();
    const failure = new Error('audit or queue failed');
    onReplaced.mockRejectedValue(failure);
    await expect(repository.replaceRejectedDocument(operation)).rejects.toBe(failure);
  });

  it('los errores de base desconocidos se propagan', async () => {
    const { repository, accessRequest, operation } = build();
    const failure = prismaError('P2024');
    accessRequest.update.mockReset().mockRejectedValue(failure);
    await expect(repository.replaceRejectedDocument(operation)).rejects.toBe(failure);
  });

  it('solo una operación simultánea puede reservar la misma revisión', async () => {
    const { repository, accessRequest, operation, createFile, onReplaced } = build();
    let reserved = false;
    accessRequest.update.mockReset().mockImplementation(async (args: { data: { status?: unknown } }) => {
      if (args.data.status) {
        if (reserved) throw prismaError('P2025');
        reserved = true;
        return correctionSnapshot();
      }
      return { id: 'request-1' };
    });
    const results = await Promise.allSettled([repository.replaceRejectedDocument(operation), repository.replaceRejectedDocument(operation)]);
    expect(results.filter((value) => value.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((value) => value.status === 'rejected')).toHaveLength(1);
    expect(createFile).toHaveBeenCalledTimes(1);
    expect(onReplaced).toHaveBeenCalledTimes(1);
  });
});
