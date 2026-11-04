import { describe, expect, it } from 'vitest';
import type { ValidatedFile } from '../../../common/types/validated-file.type.js';
import { APPOINTMENT_DOCUMENT_FILE_NAME_MAX_LENGTH } from '../constants/appointment-document.constants.js';
import { AppointmentDocumentMapper } from '../mappers/appointment-document.mapper.js';
import {
  createDocumentFileRecord,
  createMulterFile,
  PDF_CONTENT,
} from './fixtures/appointment-document.fixture.js';

describe('AppointmentDocumentMapper', () => {
  const mapper = new AppointmentDocumentMapper();

  function validated(originalName: string): ValidatedFile {
    return {
      originalName,
      mimeType: 'text/plain',
      size: PDF_CONTENT.length,
      buffer: PDF_CONTENT,
      detectedType: 'pdf',
      detectedMimeType: 'application/pdf',
    };
  }

  it('maps the multer file to the shared upload shape', () => {
    const file = createMulterFile();

    expect(mapper.toUploadedFile(file)).toEqual({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });
  });

  it('stores the detected mime type and real size instead of the client values', () => {
    expect(mapper.toSaveData(validated('Tesis.pdf'))).toEqual({
      fileName: 'Tesis.pdf',
      mimeType: 'application/pdf',
      sizeBytes: PDF_CONTENT.length,
      data: PDF_CONTENT,
    });
  });

  it('decodes UTF-8 names that multer reads as latin1', () => {
    const latin1Name = Buffer.from('Diseño gráfico.png', 'utf8').toString(
      'latin1',
    );

    expect(mapper.toSaveData(validated(latin1Name)).fileName).toBe(
      'Diseño gráfico.png',
    );
  });

  it('removes control characters and surrounding spaces from the name', () => {
    expect(mapper.toSaveData(validated('  cv\r\n\t.pdf  ')).fileName).toBe(
      'cv.pdf',
    );
  });

  it('falls back to a default name when nothing remains', () => {
    expect(mapper.toSaveData(validated(' \n ')).fileName).toBe('documento');
  });

  it('truncates names longer than the column allows', () => {
    const fileName = mapper.toSaveData(
      validated(`${'a'.repeat(300)}.pdf`),
    ).fileName;

    expect(fileName).toHaveLength(APPOINTMENT_DOCUMENT_FILE_NAME_MAX_LENGTH);
  });

  it('maps the stored metadata to the API response', () => {
    const { data: _data, ...metadata } = createDocumentFileRecord();

    expect(mapper.toResponse(metadata)).toEqual({
      fileName: 'Tesis_capitulo_2.pdf',
      mimeType: 'application/pdf',
      sizeBytes: PDF_CONTENT.length,
      uploadedAt: '2026-10-22T15:00:00.000Z',
    });
  });

  it('builds an attachment download with the original name', () => {
    const download = mapper.toDownload(createDocumentFileRecord());

    expect(download.content.equals(PDF_CONTENT)).toBe(true);
    expect(download.mimeType).toBe('application/pdf');
    expect(download.contentDisposition).toBe(
      `attachment; filename="Tesis_capitulo_2.pdf"; filename*=UTF-8''Tesis_capitulo_2.pdf`,
    );
  });

  it('keeps the header safe for accents, quotes and RFC 5987 reserved characters', () => {
    const download = mapper.toDownload(
      createDocumentFileRecord({ fileName: `Diseño "final" (v2)'s*.png` }),
    );

    expect(download.contentDisposition).toBe(
      `attachment; filename="Diseno _final_ (v2)'s*.png"; filename*=UTF-8''Dise%C3%B1o%20%22final%22%20%28v2%29%27s%2A.png`,
    );
  });
});
