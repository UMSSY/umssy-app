import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorker } from 'tesseract.js';
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
    vi.unstubAllEnvs();
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
  it('reintenta crear el worker después de un fallo de inicialización', async () => {
    vi.stubEnv('OCR_ENGINE', 'tesseract');
    vi.mocked(createWorker).mockRejectedValueOnce(new Error('init failed'));
    const image = { name: 'diploma.jpg', extension: 'jpg', mimeType: 'image/jpeg', content: Buffer.from('image') };
    await expect(service.extract(image)).rejects.toThrow('init failed');
    await expect(service.extract(image)).resolves.toHaveProperty('text', 'Texto de Tesseract');
    expect(createWorker).toHaveBeenCalledTimes(2);
    expect(createWorker).toHaveBeenLastCalledWith('spa', 1, expect.objectContaining({
      gzip: false, cacheMethod: 'none', langPath: expect.any(String),
    }));
  });

  it('no usa el mismo worker para dos reconocimientos simultáneos', async () => {
    vi.stubEnv('OCR_ENGINE', 'tesseract');
    let active = 0;
    let peak = 0;
    vi.mocked(createWorker).mockResolvedValueOnce({
      recognize: vi.fn().mockImplementation(async () => {
        active += 1;
        peak = Math.max(peak, active);
        await Promise.resolve();
        active -= 1;
        return { data: { text: 'Documento', confidence: 90 } };
      }),
      terminate: vi.fn().mockResolvedValue(undefined),
    } as never);
    const image = { name: 'diploma.jpg', extension: 'jpg', mimeType: 'image/jpeg', content: Buffer.from('image') };
    await Promise.all([service.extract(image), service.extract(image)]);
    expect(peak).toBe(1);
  });

});
