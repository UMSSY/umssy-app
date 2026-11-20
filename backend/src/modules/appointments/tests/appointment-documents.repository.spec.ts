import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  APPOINTMENT_DOCUMENT_FILE_SELECT,
  APPOINTMENT_DOCUMENT_METADATA_SELECT,
} from '../constants/appointment-document-select.constants.js';
import { AppointmentDocumentsRepository } from '../repositories/appointment-documents.repository.js';
import {
  createDocumentFileRecord,
  PDF_CONTENT,
} from './fixtures/appointment-document.fixture.js';
import { APPOINTMENT_ID, NOW } from './fixtures/appointment-record.fixture.js';

describe('AppointmentDocumentsRepository', () => {
  const upsert = vi.fn();
  const findUnique = vi.fn();
  const repository = new AppointmentDocumentsRepository({
    appointmentDocument: { upsert, findUnique },
  } as unknown as PrismaService);
  const document = {
    fileName: 'Tesis.pdf',
    mimeType: 'application/pdf',
    sizeBytes: PDF_CONTENT.length,
    data: PDF_CONTENT,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates the document or replaces the previous one of the appointment', async () => {
    const { data: _data, ...metadata } = createDocumentFileRecord();
    upsert.mockResolvedValue(metadata);

    await expect(repository.save(APPOINTMENT_ID, document)).resolves.toBe(
      metadata,
    );

    const [args] = upsert.mock.calls[0];
    expect(args.where).toEqual({ appointmentId: APPOINTMENT_ID });
    expect(args.select).toBe(APPOINTMENT_DOCUMENT_METADATA_SELECT);
    expect(args.create).toMatchObject({
      appointmentId: APPOINTMENT_ID,
      fileName: 'Tesis.pdf',
      mimeType: 'application/pdf',
      sizeBytes: PDF_CONTENT.length,
    });
    expect(args.update).toMatchObject({
      fileName: 'Tesis.pdf',
      uploadedAt: NOW,
    });
    expect(args.update).not.toHaveProperty('appointmentId');
    expect(Buffer.from(args.create.data).equals(PDF_CONTENT)).toBe(true);
    expect(Buffer.from(args.update.data).equals(PDF_CONTENT)).toBe(true);
  });

  it('never returns the binary content after saving', () => {
    expect(APPOINTMENT_DOCUMENT_METADATA_SELECT).not.toHaveProperty('data');
  });

  it('reads the file with its content by appointment', async () => {
    const record = createDocumentFileRecord();
    findUnique.mockResolvedValue(record);

    await expect(repository.findFile(APPOINTMENT_ID)).resolves.toBe(record);
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { appointmentId: APPOINTMENT_ID },
      select: APPOINTMENT_DOCUMENT_FILE_SELECT,
    });
  });

  it('returns null when the appointment has no document', async () => {
    findUnique.mockResolvedValue(null);

    await expect(repository.findFile(APPOINTMENT_ID)).resolves.toBeNull();
  });
});
