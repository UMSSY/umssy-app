import { beforeEach, describe, expect, it } from 'vitest';
import { EmptyFileException } from '../exceptions/empty-file.exception.js';
import { FileTooLargeException } from '../exceptions/file-too-large.exception.js';
import { InvalidFileTypeException } from '../exceptions/invalid-file-type.exception.js';
import { FileValidationService } from '../services/file-validation.service.js';
import type { FileValidationRules } from '../types/file-validation-rules.type.js';
import type { UploadedFile } from '../types/uploaded-file.type.js';

const pdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const jpgBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];

const maxSizeBytes = 5 * 1024 * 1024;

const cvRules: FileValidationRules = {
  allowedTypes: ['pdf'],
  maxSizeBytes,
};

const documentRules: FileValidationRules = {
  allowedTypes: ['pdf', 'png', 'jpg'],
  maxSizeBytes,
};

const buildFile = (
  bytes: number[],
  overrides: Partial<UploadedFile> = {},
): UploadedFile => {
  const buffer = Buffer.from(bytes);
  return {
    originalName: 'cv.pdf',
    mimeType: 'application/pdf',
    size: buffer.length,
    buffer,
    ...overrides,
  };
};

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(() => {
    service = new FileValidationService();
  });

  it('accepts a valid pdf and returns the detected type', () => {
    const file = buildFile(pdfBytes);

    const result = service.validate(file, cvRules);

    expect(result).toEqual({
      ...file,
      detectedType: 'pdf',
      detectedMimeType: 'application/pdf',
    });
  });

  it.each([
    ['png', pngBytes, 'image/png'],
    ['jpg', jpgBytes, 'image/jpeg'],
  ])('accepts a %s image when the rules allow it', (type, bytes, mimeType) => {
    const result = service.validate(
      buildFile(bytes, { originalName: `photo.${type}`, mimeType }),
      documentRules,
    );

    expect(result.detectedType).toBe(type);
    expect(result.detectedMimeType).toBe(mimeType);
  });

  it('throws an empty file exception when no file is provided', () => {
    expect(() => service.validate(undefined, cvRules)).toThrow(
      EmptyFileException,
    );
  });

  it('throws an empty file exception when the file has no content', () => {
    expect(() => service.validate(buildFile([]), cvRules)).toThrow(
      EmptyFileException,
    );
  });

  it('throws an empty file exception when the reported size is zero', () => {
    expect(() =>
      service.validate(buildFile(pdfBytes, { size: 0 }), cvRules),
    ).toThrow(EmptyFileException);
  });

  it('throws a file too large exception when the size exceeds 5 MB', () => {
    const file = buildFile(pdfBytes, { size: maxSizeBytes + 1 });

    expect(() => service.validate(file, cvRules)).toThrow(
      FileTooLargeException,
    );
  });

  it('throws a file too large exception when the content exceeds the limit', () => {
    const file = buildFile(pdfBytes, { size: 1 });

    expect(() =>
      service.validate(file, { ...cvRules, maxSizeBytes: 4 }),
    ).toThrow(FileTooLargeException);
  });

  it('accepts a file whose size is exactly the limit', () => {
    const file = buildFile(pdfBytes);

    expect(() =>
      service.validate(file, { ...cvRules, maxSizeBytes: pdfBytes.length }),
    ).not.toThrow();
  });

  it('rejects a png renamed as pdf with a pdf mime type', () => {
    const file = buildFile(pngBytes, {
      originalName: 'cv.pdf',
      mimeType: 'application/pdf',
    });

    expect(() => service.validate(file, cvRules)).toThrow(
      InvalidFileTypeException,
    );
  });

  it('rejects a file whose content matches no known signature', () => {
    const file = buildFile([0x50, 0x4b, 0x03, 0x04]);

    expect(() => service.validate(file, cvRules)).toThrow(
      InvalidFileTypeException,
    );
  });

  it('rejects a file shorter than the pdf signature', () => {
    expect(() => service.validate(buildFile([0x25, 0x50]), cvRules)).toThrow(
      InvalidFileTypeException,
    );
  });
});
