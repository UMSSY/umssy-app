import { beforeEach, describe, expect, it } from 'vitest';
import { CorruptedFileException } from '../exceptions/corrupted-file.exception.js';
import { EmptyFileException } from '../exceptions/empty-file.exception.js';
import { FileTooLargeException } from '../exceptions/file-too-large.exception.js';
import { InvalidFileTypeException } from '../exceptions/invalid-file-type.exception.js';
import { FileValidationService } from '../services/file-validation.service.js';
import type { FileValidationRules } from '../types/file-validation-rules.type.js';
import type { UploadedFile } from '../types/uploaded-file.type.js';

const maxSizeBytes = 5 * 1024 * 1024;

const cvRules: FileValidationRules = {
  allowedTypes: ['pdf'],
  maxSizeBytes,
};

const documentRules: FileValidationRules = {
  allowedTypes: ['pdf', 'png', 'jpg'],
  maxSizeBytes,
};

function buildFile(
  bytes: number[],
  overrides: Partial<UploadedFile> = {},
): UploadedFile {
  const buffer = Buffer.from(bytes);
  return {
    originalName: 'file.bin',
    mimeType: 'application/octet-stream',
    size: buffer.length,
    buffer,
    ...overrides,
  };
}

function buildFileFromBuffer(
  buffer: Buffer,
  overrides: Partial<UploadedFile> = {},
): UploadedFile {
  return {
    originalName: 'file.bin',
    mimeType: 'application/octet-stream',
    size: buffer.length,
    buffer,
    ...overrides,
  };
}

function makeMinimalPdf(): Buffer {
  const header = Buffer.from('%PDF-1.4\n');
  const body = Buffer.alloc(60, 0x20);
  const trailer = Buffer.from('\n%%EOF\n');
  return Buffer.concat([header, body, trailer]);
}

function makeMinimalPng(): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0d, // length 13
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width 1
    0x00, 0x00, 0x00, 0x01, // height 1
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color, comp, filter, interlace
    0x1f, 0x15, 0xc4, 0x89, // CRC
  ]);
  const body = Buffer.alloc(20, 0x20);
  const iend = Buffer.from([
    0x00, 0x00, 0x00, 0x00, // length 0
    0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82, // IEND + CRC
  ]);
  return Buffer.concat([sig, ihdr, body, iend]);
}

function makeMinimalJpg(sofMarker = 0xc0): Buffer {
  const soi = Buffer.from([0xff, 0xd8]);
  const app0 = Buffer.concat([
    Buffer.from([0xff, 0xe0, 0x00, 0x10]),
    Buffer.from('JFIF\0\x01\x01\x00\x00\x01\x00\x01\x00\x00', 'binary'),
  ]);
  const sof = Buffer.from([
    0xff,
    sofMarker,
    0x00,
    0x0b,
    0x08,
    0x00,
    0x01,
    0x00,
    0x01,
    0x01,
    0x01,
    0x11,
    0x00,
  ]);
  const sos = Buffer.from([
    0xff,
    0xda,
    0x00,
    0x08,
    0x01,
    0x01,
    0x00,
    0x00,
    0x3f,
    0x00,
  ]);
  const scanData = Buffer.alloc(16, 0x7f);
  const eoi = Buffer.from([0xff, 0xd9]);
  return Buffer.concat([soi, app0, sof, sos, scanData, eoi]);
}

describe('FileValidationService', () => {
  let service: FileValidationService;

  beforeEach(() => {
    service = new FileValidationService();
  });

  describe('valid complete files', () => {
    it('accepts a structurally complete pdf', () => {
      const file = buildFileFromBuffer(makeMinimalPdf(), {
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
      });

      const result = service.validate(file, cvRules);

      expect(result.detectedType).toBe('pdf');
      expect(result.detectedMimeType).toBe('application/pdf');
    });

    it.each([
      ['a line feed', '\n'],
      ['a carriage return and line feed', '\r\n'],
      ['spaces and line breaks', '  \n\n \r\n'],
    ])('accepts a pdf whose %%EOF marker is followed by %s', (_name, suffix) => {
      const buffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n'),
        Buffer.alloc(60, 0x20),
        Buffer.from(`\n%%EOF${suffix}`),
      ]);

      const result = service.validate(
        buildFileFromBuffer(buffer, { mimeType: 'application/pdf' }),
        cvRules,
      );

      expect(result.detectedType).toBe('pdf');
    });

    it('accepts a structurally complete png', () => {
      const file = buildFileFromBuffer(makeMinimalPng(), {
        originalName: 'photo.png',
        mimeType: 'image/png',
      });

      const result = service.validate(file, documentRules);

      expect(result.detectedType).toBe('png');
      expect(result.detectedMimeType).toBe('image/png');
    });

    it('accepts a structurally complete jpg', () => {
      const file = buildFileFromBuffer(makeMinimalJpg(), {
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
      });

      const result = service.validate(file, documentRules);

      expect(result.detectedType).toBe('jpg');
      expect(result.detectedMimeType).toBe('image/jpeg');
    });

    it.each([
      ['null bytes', Buffer.from([0x00, 0x00])],
      ['line breaks', Buffer.from('\r\n')],
      ['spaces and line breaks', Buffer.from(' \n\t')],
    ])('accepts a jpg whose EOI marker is followed by legitimate %s', (_name, suffix) => {
      const buffer = Buffer.concat([makeMinimalJpg(), suffix]);
      const file = buildFileFromBuffer(buffer, {
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
      });

      const result = service.validate(file, documentRules);
      expect(result.detectedType).toBe('jpg');
    });

    it('accepts a progressive jpg with SOF2 (0xC2)', () => {
      const file = buildFileFromBuffer(makeMinimalJpg(0xc2), {
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
      });

      const result = service.validate(file, documentRules);
      expect(result.detectedType).toBe('jpg');
    });
  });

  describe('JPEG structural validation and polyglot prevention', () => {
    it('rejects a jpg with trailing ZIP local header (PK\\x03\\x04 polyglot)', () => {
      const polyglot = Buffer.concat([
        makeMinimalJpg(),
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg with trailing ZIP EOCD header (PK\\x05\\x06 polyglot)', () => {
      const polyglot = Buffer.concat([
        makeMinimalJpg(),
        Buffer.from([0x50, 0x4b, 0x05, 0x06, 0x00, 0x00]),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg with trailing DOS/PE executable signature (MZ polyglot)', () => {
      const polyglot = Buffer.concat([
        makeMinimalJpg(),
        Buffer.from('MZ\x90\x00\x03\x00\x00\x00'),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg with trailing ELF executable signature', () => {
      const polyglot = Buffer.concat([
        makeMinimalJpg(),
        Buffer.from([0x7f, 0x45, 0x4c, 0x46]),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg with excessive trailing residual bytes after EOI', () => {
      const excessive = Buffer.concat([makeMinimalJpg(), Buffer.alloc(100, 0x00)]);
      const file = buildFileFromBuffer(excessive, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg with an illegal marker (e.g. 0xFF 0x20)', () => {
      const base = makeMinimalJpg();
      const withIllegalMarker = Buffer.concat([
        base.subarray(0, 2),
        Buffer.from([0xff, 0x20]),
        base.subarray(2),
      ]);
      const file = buildFileFromBuffer(withIllegalMarker, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg with an inconsistent marker length (< 2)', () => {
      const base = Buffer.from(makeMinimalJpg());
      // Offset 4 is APP0 length field
      base.writeUInt16BE(1, 4);
      const file = buildFileFromBuffer(base, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg with marker length exceeding buffer bounds', () => {
      const base = Buffer.from(makeMinimalJpg());
      base.writeUInt16BE(4000, 4);
      const file = buildFileFromBuffer(base, { mimeType: 'image/jpeg' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('accepts a minimal synthetic jpg fixture without SOF/SOS markers', () => {
      const syntheticJpg = Buffer.concat([
        Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        Buffer.alloc(50, 0x00),
        Buffer.from([0xff, 0xd9]),
      ]);
      const file = buildFileFromBuffer(syntheticJpg, { mimeType: 'image/jpeg' });

      const result = service.validate(file, documentRules);
      expect(result.detectedType).toBe('jpg');
    });

    it('accepts a jpg missing an SOS marker as long as markers are valid', () => {
      const base = makeMinimalJpg();
      // Keep SOI, APP0, SOF (0..33), omit SOS and scan data, and append valid padding + EOI
      const missingSos = Buffer.concat([
        base.subarray(0, 33),
        Buffer.alloc(20, 0x00),
        Buffer.from([0xff, 0xd9]),
      ]);
      const file = buildFileFromBuffer(missingSos, { mimeType: 'image/jpeg' });

      const result = service.validate(file, documentRules);
      expect(result.detectedType).toBe('jpg');
    });
  });

  describe('PNG structural validation and polyglot prevention', () => {
    it('accepts a synthetic png fixture without IHDR chunk but with valid header and IEND', () => {
      const syntheticPng = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        Buffer.alloc(50, 0x00),
        Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]),
      ]);
      const file = buildFileFromBuffer(syntheticPng, { mimeType: 'image/png' });

      const result = service.validate(file, documentRules);
      expect(result.detectedType).toBe('png');
    });

    it('rejects a png with incomplete magic header', () => {
      const incompleteHeader = Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]),
        makeMinimalPng().subarray(8),
      ]);
      const file = buildFileFromBuffer(incompleteHeader, { mimeType: 'image/png' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a png with trailing ZIP polyglot (PK\\x03\\x04)', () => {
      const polyglot = Buffer.concat([
        makeMinimalPng(),
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'image/png' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a png with trailing executable signature (MZ)', () => {
      const polyglot = Buffer.concat([
        makeMinimalPng(),
        Buffer.from('MZ\x90\x00'),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'image/png' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a png with suspicious trailing chunks or blocks after IEND', () => {
      const withTrailingBlock = Buffer.concat([
        makeMinimalPng(),
        Buffer.from('tEXtSomeDataPayload'),
      ]);
      const file = buildFileFromBuffer(withTrailingBlock, { mimeType: 'image/png' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a png with excessive trailing bytes after IEND', () => {
      const excessive = Buffer.concat([makeMinimalPng(), Buffer.alloc(100, 0x00)]);
      const file = buildFileFromBuffer(excessive, { mimeType: 'image/png' });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });
  });

  describe('PDF structural validation and polyglot prevention', () => {
    it('rejects a pdf with binary prefix before %PDF- (dual format/polyglot)', () => {
      const polyglot = Buffer.concat([
        Buffer.from('MZ\x90\x00'),
        makeMinimalPdf(),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'application/pdf' });

      expect(() => service.validate(file, cvRules)).toThrow(
        InvalidFileTypeException,
      );
    });

    it('rejects a pdf without %PDF- header', () => {
      const noHeader = Buffer.concat([
        Buffer.from('%PDFX1.4\n'),
        Buffer.alloc(60, 0x20),
        Buffer.from('\n%%EOF\n'),
      ]);
      const file = buildFileFromBuffer(noHeader, { mimeType: 'application/pdf' });

      expect(() => service.validate(file, cvRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a pdf with trailing ZIP polyglot (PK\\x03\\x04)', () => {
      const polyglot = Buffer.concat([
        makeMinimalPdf(),
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'application/pdf' });

      expect(() => service.validate(file, cvRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a pdf with trailing executable (MZ)', () => {
      const polyglot = Buffer.concat([
        makeMinimalPdf(),
        Buffer.from('MZ\x90\x00'),
      ]);
      const file = buildFileFromBuffer(polyglot, { mimeType: 'application/pdf' });

      expect(() => service.validate(file, cvRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a pdf with excessive trailing bytes after %%EOF', () => {
      const excessive = Buffer.concat([makeMinimalPdf(), Buffer.alloc(100, 0x00)]);
      const file = buildFileFromBuffer(excessive, { mimeType: 'application/pdf' });

      expect(() => service.validate(file, cvRules)).toThrow(
        CorruptedFileException,
      );
    });
  });

  describe('truncated files (signature only, no closing marker)', () => {
    it('rejects a pdf that is only 4 bytes of signature', () => {
      const file = buildFile([0x25, 0x50, 0x44, 0x46], {
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
      });

      expect(() => service.validate(file, cvRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a png that is only 4 bytes of signature', () => {
      const file = buildFile([0x89, 0x50, 0x4e, 0x47], {
        originalName: 'photo.png',
        mimeType: 'image/png',
      });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg that is only 3 bytes of signature', () => {
      const file = buildFile([0xff, 0xd8, 0xff], {
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
      });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });
  });

  describe('files missing the closing marker', () => {
    it('rejects a pdf without the %%EOF marker', () => {
      const header = Buffer.from('%PDF-1.4\n');
      const body = Buffer.alloc(60, 0x20);
      const truncated = Buffer.concat([header, body]);
      const file = buildFileFromBuffer(truncated, {
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
      });

      expect(() => service.validate(file, cvRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a png without the IEND chunk', () => {
      const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const body = Buffer.alloc(60, 0x00);
      const truncated = Buffer.concat([sig, body]);
      const file = buildFileFromBuffer(truncated, {
        originalName: 'photo.png',
        mimeType: 'image/png',
      });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });

    it('rejects a jpg without the FF D9 end-of-image marker', () => {
      const soi = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const body = Buffer.alloc(60, 0x00);
      const truncated = Buffer.concat([soi, body]);
      const file = buildFileFromBuffer(truncated, {
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
      });

      expect(() => service.validate(file, documentRules)).toThrow(
        CorruptedFileException,
      );
    });
  });

  describe('existing validation (unchanged behaviour)', () => {
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
        service.validate(buildFileFromBuffer(makeMinimalPdf(), { size: 0 }), cvRules),
      ).toThrow(EmptyFileException);
    });

    it('throws a file too large exception when the size exceeds 5 MB', () => {
      const file = buildFileFromBuffer(makeMinimalPdf(), {
        size: maxSizeBytes + 1,
      });

      expect(() => service.validate(file, cvRules)).toThrow(
        FileTooLargeException,
      );
    });

    it('throws a file too large exception when the content exceeds the limit', () => {
      const file = buildFileFromBuffer(makeMinimalPdf());

      expect(() =>
        service.validate(file, { ...cvRules, maxSizeBytes: 4 }),
      ).toThrow(FileTooLargeException);
    });

    it('rejects a png renamed as pdf with a pdf mime type', () => {
      const file = buildFileFromBuffer(makeMinimalPng(), {
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

    it.each([
      [[0x89, 0x50, 0x4e, 0x47], 'image/png'],
      [[0xff, 0xd8, 0xff, 0xe0], 'image/jpeg'],
      [[0x25, 0x50, 0x44, 0x46], 'application/pdf'],
      [[0x00, 0x01, 0x02], undefined],
    ])('detects the mime type of stored content %j', (bytes, mimeType) => {
      expect(service.detectMimeType(Buffer.from(bytes))).toBe(mimeType);
    });
  });
});
