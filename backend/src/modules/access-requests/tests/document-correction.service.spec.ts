import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditEventRecorderService } from '../../audit-events/services/audit-event-recorder.service.js';
import { FilesService } from '../../files/services/files.service.js';
import { Prisma } from '../../../prisma/client.js';
import { InvalidDocumentTypeException, MissingDocumentFileException } from '../exceptions/index.js';
import { DocumentCorrectionRepository } from '../repositories/document-correction.repository.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';
import { DocumentReadingService } from '../services/document-reading.service.js';
import { DocumentCorrectionService } from '../services/document-correction.service.js';
import type { ReplaceRejectedDocumentOperation } from '../types/document-correction.types.js';
import type { AttachDocumentInput } from '../types/uploaded-file.types.js';
import { correctedFile, correctionContext, correctionSnapshot } from './document-correction.fixture.js';

describe('DocumentCorrectionService', () => {
  const repository = { replaceRejectedDocument: vi.fn() };
  const files = { create: vi.fn(), delete: vi.fn() };
  const audit = { record: vi.fn() };
  const validation = { queue: vi.fn() };
  const documentReading = { scheduleReading: vi.fn() };
  const tx = {} as Prisma.TransactionClient;
  let service: DocumentCorrectionService;
  let input: AttachDocumentInput;

  beforeEach(() => {
    vi.resetAllMocks();
    files.create.mockResolvedValue(correctedFile());
    audit.record.mockResolvedValue({ id: 'audit-1' });
    validation.queue.mockResolvedValue({ id: 'validation-1' });
    repository.replaceRejectedDocument.mockImplementation(async (operation: ReplaceRejectedDocumentOperation) => {
      const file = await operation.createFile(tx);
      await operation.onReplaced(correctionSnapshot(), file, tx);
      return { requestCode: operation.context.requestCode, status: 'pending' };
    });
    service = new DocumentCorrectionService(
      repository as unknown as DocumentCorrectionRepository,
      files as unknown as FilesService,
      audit as unknown as AuditEventRecorderService,
      validation as unknown as DocumentValidationRepository,
      documentReading as unknown as DocumentReadingService,
    );
    input = { documentType: 'national_title', file: { originalname: 'titulo.pdf', mimetype: 'application/pdf', size: 6, buffer: Buffer.from('%PDF-1') } };
  });

  it('usa el contexto autorizado, conserva la solicitud y comparte la transacción con archivo, auditoría y cola', async () => {
    await expect(service.resubmit(correctionContext(), input)).resolves.toEqual({ requestCode: 'SOL-2026-0139', status: 'pending' });
    expect(repository.replaceRejectedDocument).toHaveBeenCalledWith(expect.objectContaining({ context: correctionContext(), documentType: 'national_title' }));
    expect(files.create).toHaveBeenCalledWith({ name: 'titulo.pdf', content: input.file?.buffer }, tx);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({
      action: 'document_replaced', accessRequestId: 'request-1', evidenceFileId: 'file-old',
      detail: 'Documento anterior sustituido. Nuevo documento: file-new.',
    }), tx);
    expect(validation.queue).toHaveBeenCalledWith('request-1', tx);
    expect(files.delete).not.toHaveBeenCalled();
    expect(documentReading.scheduleReading).toHaveBeenCalledWith('request-1');
  });

  it('no reserva la revisión ni consume el permiso si falta el archivo', async () => {
    await expect(service.resubmit(correctionContext(), { ...input, file: undefined })).rejects.toBeInstanceOf(MissingDocumentFileException);
    expect(repository.replaceRejectedDocument).not.toHaveBeenCalled();
    expect(files.create).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'other_type'])('rechaza tipos documentales inválidos antes de iniciar la operación: %j', async (documentType) => {
    await expect(service.resubmit(correctionContext(), { ...input, documentType })).rejects.toBeInstanceOf(InvalidDocumentTypeException);
    expect(repository.replaceRejectedDocument).not.toHaveBeenCalled();
  });

  it.each(['academic_diploma', 'national_title'])('acepta el tipo documental permitido %s', async (documentType) => {
    await expect(service.resubmit(correctionContext(), { ...input, documentType })).resolves.toHaveProperty('status', 'pending');
  });

  it('un error de archivo se propaga sin registrar una auditoría ni tocar la cola', async () => {
    const failure = new Error('invalid or failed file');
    files.create.mockRejectedValue(failure);
    await expect(service.resubmit(correctionContext(), input)).rejects.toBe(failure);
    expect(audit.record).not.toHaveBeenCalled();
    expect(validation.queue).not.toHaveBeenCalled();
  });

  it('un fallo de auditoría interrumpe el callback transaccional', async () => {
    const failure = new Error('audit failed');
    audit.record.mockRejectedValue(failure);
    await expect(service.resubmit(correctionContext(), input)).rejects.toBe(failure);
    expect(validation.queue).not.toHaveBeenCalled();
    expect(files.delete).not.toHaveBeenCalled();
  });

  it('un fallo al preparar la nueva revisión se propaga para revertir la transacción', async () => {
    const failure = new Error('queue failed');
    validation.queue.mockRejectedValue(failure);
    await expect(service.resubmit(correctionContext(), input)).rejects.toBe(failure);
  });
});
