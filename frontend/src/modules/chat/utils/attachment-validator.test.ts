import { describe, it, expect } from 'vitest';
import {
  validateAttachmentFile,
  formatFileSize,
  isAllowedImage,
  isAllowedPdf,
} from './attachment-validator';
import {
  ATTACHMENT_ERROR_MESSAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PDF_SIZE_BYTES,
} from '../constants/attachment.constants';

describe('attachment-validator (HU-11 Task 3)', () => {
  const createFile = (name: string, size: number, type: string) => {
    const file = new File(['x'.repeat(size > 1000 ? 10 : size)], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  describe('validación de imágenes', () => {
    it('acepta imágenes JPEG de hasta 5 MB', () => {
      const file = createFile('foto.jpg', MAX_IMAGE_SIZE_BYTES, 'image/jpeg');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.type).toBe('image');
      }
    });

    it('acepta imágenes PNG de hasta 5 MB', () => {
      const file = createFile('captura.png', 2 * 1024 * 1024, 'image/png');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.type).toBe('image');
      }
    });

    it('rechaza imágenes que superan los 5 MB con el mensaje exacto acordado', () => {
      const file = createFile('pesada.jpg', MAX_IMAGE_SIZE_BYTES + 1, 'image/jpeg');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(ATTACHMENT_ERROR_MESSAGES.IMAGE_TOO_LARGE);
        expect(result.error).toBe('La imagen supera el tamaño maximo permitido de 5 MB.');
      }
    });
  });

  describe('validación de documentos PDF', () => {
    it('acepta documentos PDF de hasta 10 MB', () => {
      const file = createFile('documento.pdf', MAX_PDF_SIZE_BYTES, 'application/pdf');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.type).toBe('pdf');
      }
    });

    it('rechaza documentos PDF que superan los 10 MB con el mensaje exacto acordado', () => {
      const file = createFile('libro.pdf', MAX_PDF_SIZE_BYTES + 1, 'application/pdf');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(ATTACHMENT_ERROR_MESSAGES.PDF_TOO_LARGE);
        expect(result.error).toBe('El documento supera el tamaño maximo permitido 10 MB.');
      }
    });
  });

  describe('validación de formatos no permitidos', () => {
    it('rechaza ejecutables (.exe)', () => {
      const file = createFile('virus.exe', 1024, 'application/x-msdownload');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(ATTACHMENT_ERROR_MESSAGES.INVALID_FORMAT);
        expect(result.error).toBe(
          'Formato no permitido, Solo puedes adjuntar imágenes (JPG, PNG) o documentos PDF.',
        );
      }
    });

    it('rechaza archivos de Office (.docx)', () => {
      const file = createFile('curriculum.docx', 2048, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(ATTACHMENT_ERROR_MESSAGES.INVALID_FORMAT);
      }
    });

    it('rechaza archivos comprimidos (.zip)', () => {
      const file = createFile('archivos.zip', 4096, 'application/zip');
      const result = validateAttachmentFile(file);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe(ATTACHMENT_ERROR_MESSAGES.INVALID_FORMAT);
      }
    });
  });

  describe('formatFileSize', () => {
    it('formatea bytes correctamente', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(245 * 1024)).toBe('245 KB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
      expect(formatFileSize(3.2 * 1024 * 1024)).toBe('3.2 MB');
    });
  });

  describe('isAllowedImage y isAllowedPdf', () => {
    it('reconoce correctamente extensiones y tipos mime de imágenes y pdfs', () => {
      expect(isAllowedImage(createFile('foto.jpg', 100, 'image/jpeg'))).toBe(true);
      expect(isAllowedImage(createFile('captura.png', 100, 'image/png'))).toBe(true);
      expect(isAllowedImage(createFile('documento.pdf', 100, 'application/pdf'))).toBe(false);

      expect(isAllowedPdf(createFile('documento.pdf', 100, 'application/pdf'))).toBe(true);
      expect(isAllowedPdf(createFile('foto.jpg', 100, 'image/jpeg'))).toBe(false);
    });
  });
});

