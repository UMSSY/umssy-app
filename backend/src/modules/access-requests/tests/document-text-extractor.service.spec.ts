import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentTextExtractorService } from '../services/document-text-extractor.service.js';

vi.mock('mupdf', () => {
  return {
    Document: {
      openDocument: vi.fn().mockReturnValue({
        countPages: vi.fn().mockReturnValue(1),
        loadPage: vi.fn().mockReturnValue({
          toStructuredText: vi.fn().mockReturnValue({
            asText: vi.fn().mockReturnValue('Texto embebido de prueba suficientemente largo para superar el umbral minimo.'),
          }),
          toPixmap: vi.fn().mockReturnValue({
            asPNG: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
            convertToColorSpace: vi.fn().mockReturnValue({
              getWidth: vi.fn().mockReturnValue(100),
              getHeight: vi.fn().mockReturnValue(100),
              getPixels: vi.fn().mockReturnValue(new Uint8Array(30000)),
            }),
          }),
        }),
      }),
    },
    Matrix: {
      scale: vi.fn().mockReturnValue({}),
    },
    ColorSpace: {
      DeviceRGB: {},
    },
    Image: vi.fn().mockImplementation(function (this: unknown) {
      return {
        toPixmap: vi.fn().mockReturnValue({
          convertToColorSpace: vi.fn().mockReturnValue({
            getWidth: vi.fn().mockReturnValue(100),
            getHeight: vi.fn().mockReturnValue(100),
            getPixels: vi.fn().mockReturnValue(new Uint8Array(30000)),
          }),
        }),
      };
    }),
  };
});

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn().mockResolvedValue({
    recognize: vi.fn().mockResolvedValue({
      data: { text: 'Texto de Tesseract', confidence: 90 },
    }),
    terminate: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../../common/ocr/paddle-ocr.js', () => ({
  createPaddleWorker: vi.fn().mockResolvedValue({
    destroy: vi.fn().mockResolvedValue(undefined),
  }),
  recognizeWithPaddle: vi.fn().mockResolvedValue({
    text: 'Texto de PaddleOCR',
    confidence: 0.96,
  }),
}));

vi.mock('node:fs/promises', () => ({
  access: vi.fn().mockResolvedValue(undefined),
}));

describe('DocumentTextExtractorService', () => {
  let service: DocumentTextExtractorService;

  beforeEach(() => {
    service = new DocumentTextExtractorService();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    vi.clearAllMocks();
  });

  it('extrae texto embebido directamente de un PDF digital', async () => {
    const result = await service.extract({
      name: 'diploma.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      content: Buffer.from('fake pdf content'),
    });

    expect(result.text).toContain('Texto embebido de prueba');
    expect(result.confidence).toBe(0.95);
  });

  it('usa PaddleOCR cuando se procesa una imagen y los modelos existen', async () => {
    const result = await service.extract({
      name: 'diploma.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      content: Buffer.from('fake image content'),
    });

    expect(result.text).toBe('Texto de PaddleOCR');
    expect(result.confidence).toBe(0.96);
  });

  it('destruye los workers al finalizar el modulo', async () => {
    await service.extract({
      name: 'diploma.jpg',
      extension: 'jpg',
      mimeType: 'image/jpeg',
      content: Buffer.from('fake image content'),
    });

    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
  });
});
