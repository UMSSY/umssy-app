import { FIXTURE_PDF } from '../../../../common/constants/seed-fixture-document.constants.js';
import type { MulterFile } from '../../../../common/types/multer-file.type.js';
import type { AppointmentDocumentFileRecord } from '../../types/appointment-document-file-record.types.js';

export const DOCUMENT_UPLOADED_AT = new Date('2026-10-22T15:00:00.000Z');

export const PDF_CONTENT = FIXTURE_PDF;

export const PNG_CONTENT = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from([
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89,
  ]),
  Buffer.alloc(20, 0x20),
  Buffer.from([
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]),
]);

export const JPG_CONTENT = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  Buffer.from('JFIF\0\x01\x01\x00\x00\x01\x00\x01\x00\x00', 'binary'),
  Buffer.from([
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
    0x00,
  ]),
  Buffer.from([0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00]),
  Buffer.alloc(16, 0x7f),
  Buffer.from([0xff, 0xd9]),
]);

export function createMulterFile(
  overrides: Partial<MulterFile> = {},
): MulterFile {
  const buffer = overrides.buffer ?? PDF_CONTENT;

  return {
    originalname: 'Tesis_capitulo_2.pdf',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    ...overrides,
  };
}

export function createDocumentFileRecord(
  overrides: Partial<AppointmentDocumentFileRecord> = {},
): AppointmentDocumentFileRecord {
  return {
    fileName: 'Tesis_capitulo_2.pdf',
    mimeType: 'application/pdf',
    sizeBytes: PDF_CONTENT.length,
    uploadedAt: DOCUMENT_UPLOADED_AT,
    data: new Uint8Array(PDF_CONTENT),
    ...overrides,
  };
}
