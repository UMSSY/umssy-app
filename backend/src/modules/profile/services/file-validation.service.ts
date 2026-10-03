import { Injectable } from '@nestjs/common';
import { EmptyFileException } from '../exceptions/empty-file.exception.js';
import { FileTooLargeException } from '../exceptions/file-too-large.exception.js';
import { InvalidFileTypeException } from '../exceptions/invalid-file-type.exception.js';
import type { FileSignature } from '../types/file-signature.type.js';
import type { FileValidationRules } from '../types/file-validation-rules.type.js';
import type { UploadedFile } from '../types/uploaded-file.type.js';
import type { ValidatedFile } from '../types/validated-file.type.js';

const fileSignatures: readonly FileSignature[] = [
  { type: 'pdf', mimeType: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { type: 'png', mimeType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { type: 'jpg', mimeType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
];

@Injectable()
export class FileValidationService {
  validate(
    file: UploadedFile | undefined,
    rules: FileValidationRules,
  ): ValidatedFile {
    if (!file || file.size === 0 || file.buffer.length === 0) {
      throw new EmptyFileException();
    }

    if (file.size > rules.maxSizeBytes || file.buffer.length > rules.maxSizeBytes) {
      throw new FileTooLargeException();
    }

    const signature = this.detectSignature(file.buffer);

    if (!signature || !rules.allowedTypes.includes(signature.type)) {
      throw new InvalidFileTypeException();
    }

    return {
      ...file,
      detectedType: signature.type,
      detectedMimeType: signature.mimeType,
    };
  }

  private detectSignature(buffer: Buffer): FileSignature | undefined {
    return fileSignatures.find((signature) =>
      signature.bytes.every((byte, index) => buffer[index] === byte),
    );
  }
}
