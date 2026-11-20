import { Injectable } from '@nestjs/common';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import type { UploadedFile } from '../../../common/types/uploaded-file.type.js';
import type { ValidatedFile } from '../../../common/types/validated-file.type.js';
import { decodeUploadFileName } from '../../access-requests/helpers/decode-upload-file-name.js';

import type { AppointmentDocumentDownload } from '../types/appointment-document-download.types.js';
import type { AppointmentDocumentFileRecord } from '../types/appointment-document-file-record.types.js';
import type { AppointmentDocumentMetadataRecord } from '../types/appointment-document-metadata-record.types.js';
import type { AppointmentDocumentResponse } from '../types/appointment-document-response.types.js';
import type { SaveAppointmentDocumentData } from '../types/save-appointment-document-data.types.js';

const UNSAFE_HEADER_CHARACTERS = /[^\x20-\x7e]|["\\]/g;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const INVISIBLE_CHARACTERS = /[\p{Cc}\p{Cf}]/gu;
const RFC5987_RESERVED_CHARACTERS = /['()*]/g;

@Injectable()
export class AppointmentDocumentMapper {
  toUploadedFile(file: MulterFile): UploadedFile {
    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };
  }

  toSaveData(file: ValidatedFile): SaveAppointmentDocumentData {
    return {
      fileName: this.toStoredFileName(file.originalName),
      mimeType: file.detectedMimeType,
      sizeBytes: file.buffer.length,
      data: file.buffer,
    };
  }

  toResponse(
    document: AppointmentDocumentMetadataRecord,
  ): AppointmentDocumentResponse {
    return {
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      uploadedAt: document.uploadedAt.toISOString(),
    };
  }

  toDownload(
    document: AppointmentDocumentFileRecord,
  ): AppointmentDocumentDownload {
    return {
      content: Buffer.from(document.data),
      mimeType: document.mimeType,
      contentDisposition: this.toContentDisposition(document.fileName),
    };
  }

  private toStoredFileName(originalName: string): string {
    const name = decodeUploadFileName(originalName)
      .replace(INVISIBLE_CHARACTERS, '')
      .trim();

    return Array.from(name || 'documento')
      .slice(0, 255)
      .join('');
  }

  private toContentDisposition(fileName: string): string {
    const asciiName = fileName
      .normalize('NFD')
      .replace(COMBINING_MARKS, '')
      .replace(UNSAFE_HEADER_CHARACTERS, '_');

    return `attachment; filename="${asciiName}"; filename*=UTF-8''${this.toRfc5987Value(fileName)}`;
  }

  private toRfc5987Value(value: string): string {
    return encodeURIComponent(value).replace(
      RFC5987_RESERVED_CHARACTERS,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }
}
