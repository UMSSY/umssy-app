import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPaddleWorker, recognizeWithPaddle } from '../../../common/ocr/paddle-ocr.js';
import { DocumentTextExtractorService } from '../services/document-text-extractor.service.js';

const mocks = vi.hoisted(() => {
  const pixmap = { getWidth: vi.fn(() => 100), getHeight: vi.fn(() => 100), getPixels: vi.fn(() => new Uint8Array(30000)), destroy: vi.fn() };
  const page = { toPixmap: vi.fn(() => pixmap), destroy: vi.fn() };
  const document = { countPages: vi.fn(() => 2), loadPage: vi.fn(() => page), destroy: vi.fn() };
  const source = { convertToColorSpace: vi.fn(() => pixmap), destroy: vi.fn() };
  const image = { toPixmap: vi.fn(() => source), destroy: vi.fn() };
  const worker = { destroy: vi.fn(async () => undefined) };
  return { pixmap, page, document, source, image, worker };
});

vi.mock('mupdf', () => ({
  Document: { openDocument: vi.fn(() => mocks.document) },
  Matrix: { scale: vi.fn(() => [2, 0, 0, 2, 0, 0]) },
  ColorSpace: { DeviceRGB: {} },
  Image: vi.fn(function () { return mocks.image; }),
}));
vi.mock('../../../common/ocr/paddle-ocr.js', () => ({
  createPaddleWorker: vi.fn(),
  recognizeWithPaddle: vi.fn(),
}));

const IMAGE = { name: 'document.jpg', extension: 'jpg', mimeType: 'image/jpeg', content: Buffer.from('unit fixture') };
const RESULT = { text: 'Nombre leído', confidence: 0.96, regions: [{ text: 'Nombre leído', confidence: 0.96, box: { x: 1, y: 2, width: 30, height: 10 } }] };

describe('DocumentTextExtractorService: Paddle obligatorio', () => {
  let service: DocumentTextExtractorService;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('OCR_ENGINE', 'paddle');
    vi.mocked(createPaddleWorker).mockReset().mockResolvedValue(mocks.worker as never);
    vi.mocked(recognizeWithPaddle).mockReset().mockResolvedValue(RESULT);
    mocks.document.countPages.mockReturnValue(2);
    service = new DocumentTextExtractorService();
  });
  afterEach(async () => { await service.onModuleDestroy(); vi.unstubAllEnvs(); });

  it('conserva texto, regiones y motor, sin datos del nombre del archivo', async () => {
    const first = await service.extract(IMAGE);
    const renamed = await service.extract({ ...IMAGE, name: 'Otro Nombre 2025.jpg' });
    expect(first).toEqual(renamed);
    expect(first).toMatchObject({ engine: 'paddle', text: RESULT.text, regions: [{ page: 1, box: RESULT.regions[0].box }] });
    expect(mocks.image.destroy).toHaveBeenCalledTimes(2);
    expect(mocks.source.destroy).toHaveBeenCalledTimes(2);
    expect(mocks.pixmap.destroy).toHaveBeenCalledTimes(2);
  });

  it('procesa todas las páginas del PDF sin asignar confianza sintética', async () => {
    vi.mocked(recognizeWithPaddle).mockResolvedValueOnce(RESULT).mockResolvedValueOnce({ ...RESULT, text: 'Segunda página', confidence: 0.72 });
    const result = await service.extract({ ...IMAGE, mimeType: 'application/pdf' });
    expect(mocks.document.loadPage.mock.calls).toEqual([[0], [1]]);
    expect(result.text).toBe('Nombre leído\nSegunda página');
    expect(result.confidence).toBe(0.72);
    expect(result.regions?.map((region) => region.page)).toEqual([1, 2]);
    expect(mocks.page.destroy).toHaveBeenCalledTimes(2);
    expect(mocks.document.destroy).toHaveBeenCalledOnce();
  });

  it('propaga un fallo de modelos y reintenta inicializar en la siguiente solicitud', async () => {
    vi.mocked(createPaddleWorker).mockRejectedValueOnce(new Error('missing model'));
    await expect(service.extract(IMAGE)).rejects.toThrow('PaddleOCR initialization failed');
    expect(recognizeWithPaddle).not.toHaveBeenCalled();
    await expect(service.extract(IMAGE)).resolves.toHaveProperty('engine', 'paddle');
    expect(createPaddleWorker).toHaveBeenCalledTimes(2);
  });

  it('rechaza una configuración que solicita otro motor', async () => {
    vi.stubEnv('OCR_ENGINE', 'tesseract');
    await expect(service.extract(IMAGE)).rejects.toThrow('requires OCR_ENGINE=paddle');
    expect(createPaddleWorker).not.toHaveBeenCalled();
  });

  it('libera recursos y reinicia el worker tras error de inferencia', async () => {
    vi.mocked(recognizeWithPaddle).mockRejectedValueOnce(new Error('inference failed'));
    await expect(service.extract({ ...IMAGE, mimeType: 'application/pdf' })).rejects.toThrow('inference failed');
    expect(mocks.pixmap.destroy).toHaveBeenCalledOnce();
    expect(mocks.page.destroy).toHaveBeenCalledOnce();
    expect(mocks.document.destroy).toHaveBeenCalledOnce();
    expect(mocks.worker.destroy).toHaveBeenCalledOnce();
    await expect(service.extract(IMAGE)).resolves.toHaveProperty('text', RESULT.text);
    expect(createPaddleWorker).toHaveBeenCalledTimes(2);
  });

  it('serializa inferencias y espera antes de destruir el worker', async () => {
    let active = 0;
    let peak = 0;
    vi.mocked(recognizeWithPaddle).mockImplementation(async () => {
      active += 1; peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(mocks.worker.destroy).not.toHaveBeenCalled();
      active -= 1;
      return RESULT;
    });
    const jobs = [service.extract(IMAGE), service.extract(IMAGE)];
    await service.onModuleDestroy();
    await Promise.all(jobs);
    expect(peak).toBe(1);
    expect(mocks.worker.destroy).toHaveBeenCalledOnce();
    await expect(service.extract(IMAGE)).rejects.toThrow('shutting down');
  });
});
