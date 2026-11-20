import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CorruptedFileException } from '../../../common/exceptions/corrupted-file.exception.js';
import { EmptyFileException } from '../../../common/exceptions/empty-file.exception.js';
import { FileTooLargeException } from '../../../common/exceptions/file-too-large.exception.js';
import { InvalidFileTypeException } from '../../../common/exceptions/invalid-file-type.exception.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import {
  AppointmentClosedException,
  AppointmentDocumentNotFoundException,
  AppointmentDocumentUploadForbiddenException,
  AppointmentNotFoundException,
  AppointmentNotOwnedException,
} from '../exceptions/index.js';
import { AppointmentDocumentMapper } from '../mappers/appointment-document.mapper.js';
import { AppointmentDocumentsRepository } from '../repositories/appointment-documents.repository.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import { AppointmentDocumentsService } from '../services/appointment-documents.service.js';
import {
  createDocumentFileRecord,
  createMulterFile,
  DOCUMENT_UPLOADED_AT,
  JPG_CONTENT,
  PDF_CONTENT,
  PNG_CONTENT,
} from './fixtures/appointment-document.fixture.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('AppointmentDocumentsService', () => {
  const appointmentsRepository = { findById: vi.fn() };
  const documentsRepository = { save: vi.fn(), findFile: vi.fn() };
  let moduleRef: TestingModule;
  let service: AppointmentDocumentsService;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord(),
    );
    documentsRepository.save.mockImplementation(async (_id, data) => ({
      fileName: data.fileName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      uploadedAt: DOCUMENT_UPLOADED_AT,
    }));
    documentsRepository.findFile.mockResolvedValue(createDocumentFileRecord());

    moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentDocumentsService,
        AppointmentDocumentMapper,
        FileValidationService,
        { provide: AppointmentsRepository, useValue: appointmentsRepository },
        {
          provide: AppointmentDocumentsRepository,
          useValue: documentsRepository,
        },
      ],
    }).compile();
    service = moduleRef.get(AppointmentDocumentsService);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await moduleRef.close();
  });

  describe('upload', () => {
    it.each([
      ['PDF', 'Tesis.pdf', PDF_CONTENT, 'application/pdf'],
      ['PNG', 'Diseño.png', PNG_CONTENT, 'image/png'],
      ['JPG', 'Foto.jpg', JPG_CONTENT, 'image/jpeg'],
    ])(
      'saves a %s uploaded by the student who booked the appointment',
      async (_type, originalname, buffer, mimeType) => {
        const result = await service.upload(
          STUDENT_ID,
          APPOINTMENT_ID,
          createMulterFile({ originalname, buffer, size: buffer.length }),
        );

        expect(documentsRepository.save).toHaveBeenCalledExactlyOnceWith(
          APPOINTMENT_ID,
          {
            fileName: originalname,
            mimeType,
            sizeBytes: buffer.length,
            data: buffer,
          },
        );
        expect(result).toEqual({
          fileName: originalname,
          mimeType,
          sizeBytes: buffer.length,
          uploadedAt: DOCUMENT_UPLOADED_AT.toISOString(),
        });
      },
    );

    it('accepts appointments still stored with the legacy confirmed title', async () => {
      appointmentsRepository.findById.mockResolvedValue(
        createAppointmentRecord({ status: { title: 'CONFIRMADA' } }),
      );

      await expect(
        service.upload(STUDENT_ID, APPOINTMENT_ID, createMulterFile()),
      ).resolves.toMatchObject({ fileName: 'Tesis_capitulo_2.pdf' });
    });

    it('rejects an appointment that does not exist', async () => {
      appointmentsRepository.findById.mockResolvedValue(null);

      await expect(
        service.upload(STUDENT_ID, APPOINTMENT_ID, createMulterFile()),
      ).rejects.toBeInstanceOf(AppointmentNotFoundException);
      expect(documentsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects the mentor of the appointment with 403', async () => {
      await expect(
        service.upload(MENTOR_ID, APPOINTMENT_ID, createMulterFile()),
      ).rejects.toBeInstanceOf(AppointmentDocumentUploadForbiddenException);
      expect(documentsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a user who does not take part in the appointment', async () => {
      await expect(
        service.upload(OTHER_USER_ID, APPOINTMENT_ID, createMulterFile()),
      ).rejects.toBeInstanceOf(AppointmentNotOwnedException);
      expect(documentsRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['cancelled', { status: { title: 'CANCELLED' } }],
      ['completed', { status: { title: 'COMPLETED' } }],
      ['legacy pending', { status: { title: 'PENDIENTE' } }],
      ['already finished', { endAt: new Date(NOW.getTime()) }],
    ])(
      'rejects a %s appointment before reading the file',
      async (_case, overrides) => {
        appointmentsRepository.findById.mockResolvedValue(
          createAppointmentRecord(overrides),
        );

        await expect(
          service.upload(STUDENT_ID, APPOINTMENT_ID, undefined),
        ).rejects.toBeInstanceOf(AppointmentClosedException);
        expect(documentsRepository.save).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['a missing file', undefined, EmptyFileException],
      [
        'an unsupported type',
        createMulterFile({
          originalname: 'notas.txt',
          buffer: Buffer.from('a'.repeat(80)),
          size: 80,
        }),
        InvalidFileTypeException,
      ],
      [
        'a file over 5 MB',
        createMulterFile({
          buffer: Buffer.concat([PDF_CONTENT, Buffer.alloc(5 * 1024 * 1024)]),
          size: PDF_CONTENT.length + 5 * 1024 * 1024,
        }),
        FileTooLargeException,
      ],
      [
        'a damaged PDF',
        createMulterFile({
          buffer: PDF_CONTENT.subarray(0, PDF_CONTENT.length - 10),
          size: PDF_CONTENT.length - 10,
        }),
        CorruptedFileException,
      ],
    ])('rejects %s without saving it', async (_case, file, exception) => {
      await expect(
        service.upload(STUDENT_ID, APPOINTMENT_ID, file),
      ).rejects.toBeInstanceOf(exception);
      expect(documentsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('download', () => {
    it.each([
      ['mentor', MENTOR_ID],
      ['student', STUDENT_ID],
    ])('lets the %s download the document', async (_role, userId) => {
      const download = await service.download(userId, APPOINTMENT_ID);

      expect(documentsRepository.findFile).toHaveBeenCalledWith(APPOINTMENT_ID);
      expect(download.content.equals(PDF_CONTENT)).toBe(true);
      expect(download.mimeType).toBe('application/pdf');
      expect(download.contentDisposition).toContain(
        'filename="Tesis_capitulo_2.pdf"',
      );
    });

    it('lets participants download it after the appointment ends', async () => {
      appointmentsRepository.findById.mockResolvedValue(
        createAppointmentRecord({
          endAt: new Date('2026-10-01T00:00:00.000Z'),
          status: { title: 'COMPLETED' },
        }),
      );

      await expect(
        service.download(MENTOR_ID, APPOINTMENT_ID),
      ).resolves.toMatchObject({ mimeType: 'application/pdf' });
    });

    it('rejects a user who does not take part in the appointment', async () => {
      await expect(
        service.download(OTHER_USER_ID, APPOINTMENT_ID),
      ).rejects.toBeInstanceOf(AppointmentNotOwnedException);
      expect(documentsRepository.findFile).not.toHaveBeenCalled();
    });

    it('rejects an appointment that does not exist', async () => {
      appointmentsRepository.findById.mockResolvedValue(null);

      await expect(
        service.download(MENTOR_ID, APPOINTMENT_ID),
      ).rejects.toBeInstanceOf(AppointmentNotFoundException);
    });

    it('responds 404 when the appointment has no document', async () => {
      documentsRepository.findFile.mockResolvedValue(null);

      await expect(
        service.download(STUDENT_ID, APPOINTMENT_ID),
      ).rejects.toBeInstanceOf(AppointmentDocumentNotFoundException);
    });
  });
});
