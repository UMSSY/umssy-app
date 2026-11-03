import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTesseractWorker } from '../../../common/ocr/tesseract-ocr.js';
import { DocumentTextExtractorService } from '../services/document-text-extractor.service.js';

const mocks = vi.hoisted(() => {
  const pixmap = { asPNG: vi.fn(() => new Uint8Array([137, 80, 78, 71])), destroy: vi.fn() };
  const page = { toPixmap: vi.fn(() => pixmap), destroy: vi.fn() };
  const document = { countPages: vi.fn(() => 2), loadPage: vi.fn(() => page), destroy: vi.fn() };
  const source = { convertToColorSpace: vi.fn(() => pixmap), destroy: vi.fn() };
  const image = { toPixmap: vi.fn(() => source), destroy: vi.fn() };
  const worker = { recognize: vi.fn(), terminate: vi.fn(async () => undefined) };
  return { pixmap, page, document, source, image, worker };
});

vi.mock('mupdf', () => ({
  Document: { openDocument: vi.fn(() => mocks.document) },
  Matrix: { scale: vi.fn(() => [2, 0, 0, 2, 0, 0]) },
  ColorSpace: { DeviceRGB: {} },
  Image: vi.fn(function () { return mocks.image; }),
}));
vi.mock('../../../common/ocr/tesseract-ocr.js', () => ({
  createTesseractWorker: vi.fn(),
}));

const IMAGE = { name: 'document.jpg', extension: 'jpg', mimeType: 'image/jpeg', content: Buffer.from('unit fixture') };

/** Resultado con la forma de Tesseract: confianza de 0 a 100 y texto agrupado en bloques > párrafos > líneas. */
function tesseractResult(text: string, confidence: number) {
  return {
    data: {
      text,
      confidence,
      blocks: [{
        paragraphs: [{
          lines: [
            { text: `${text}\n`, confidence, bbox: { x0: 1, y0: 2, x1: 31, y1: 12 } },
            { text: '   ', confidence: 10, bbox: { x0: 0, y0: 0, x1: 1, y1: 1 } },
          ],
        }],
      }],
    },
  };
}

describe('DocumentTextExtractorService: Tesseract', () => {
  let service: DocumentTextExtractorService;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createTesseractWorker).mockReset().mockResolvedValue(mocks.worker as never);
    mocks.worker.recognize.mockReset().mockResolvedValue(tesseractResult('Nombre leído', 96));
    mocks.document.countPages.mockReturnValue(2);
    service = new DocumentTextExtractorService();
  });
  afterEach(async () => { await service.onModuleDestroy(); });

  it('conserva texto, regiones y motor, sin datos del nombre del archivo', async () => {
    const first = await service.extract(IMAGE);
    const renamed = await service.extract({ ...IMAGE, name: 'Otro Nombre 2025.jpg' });
    expect(first).toEqual(renamed);
    expect(first).toMatchObject({
      engine: 'tesseract',
      text: 'Nombre leído',
      regions: [{ text: 'Nombre leído', page: 1, box: { x: 1, y: 2, width: 30, height: 10 } }],
    });
    expect(first.regions).toHaveLength(1);
    expect(mocks.image.destroy).toHaveBeenCalledTimes(2);
    expect(mocks.source.destroy).toHaveBeenCalledTimes(2);
    expect(mocks.pixmap.destroy).toHaveBeenCalledTimes(2);
  });

  it('normaliza la confianza de Tesseract (0-100) a la escala 0-1 del flujo', async () => {
    mocks.worker.recognize.mockResolvedValueOnce(tesseractResult('Texto', 96));
    const result = await service.extract(IMAGE);
    expect(result.confidence).toBeCloseTo(0.96);
    expect(result.regions?.[0].confidence).toBeCloseTo(0.96);
  });

  it('acota confianzas fuera de rango o no numéricas', async () => {
    mocks.worker.recognize.mockResolvedValueOnce(tesseractResult('Alto', 250));
    expect((await service.extract(IMAGE)).confidence).toBe(1);
    mocks.worker.recognize.mockResolvedValueOnce(tesseractResult('Roto', Number.NaN));
    expect((await service.extract(IMAGE)).confidence).toBe(0);
  });

  it('entrega a Tesseract la página renderizada como PNG y solicita los bloques', async () => {
    await service.extract(IMAGE);
    const [input, options, output] = mocks.worker.recognize.mock.calls[0];
    expect(Buffer.isBuffer(input)).toBe(true);
    expect([...input]).toEqual([137, 80, 78, 71]);
    expect(options).toEqual({});
    expect(output).toEqual({ text: true, blocks: true });
  });

  it('procesa todas las páginas del PDF usando la confianza menor entre las páginas con texto', async () => {
    mocks.worker.recognize
      .mockResolvedValueOnce(tesseractResult('Nombre leído', 96))
      .mockResolvedValueOnce(tesseractResult('Segunda página', 72));
    const result = await service.extract({ ...IMAGE, mimeType: 'application/pdf' });
    expect(mocks.document.loadPage.mock.calls).toEqual([[0], [1]]);
    expect(result.text).toBe('Nombre leído\nSegunda página');
    expect(result.confidence).toBeCloseTo(0.72);
    expect(result.regions?.map((region) => region.page)).toEqual([1, 2]);
    expect(mocks.page.destroy).toHaveBeenCalledTimes(2);
    expect(mocks.document.destroy).toHaveBeenCalledOnce();
  });

  it('devuelve confianza 0 si ninguna página trae texto', async () => {
    mocks.worker.recognize.mockResolvedValue({ data: { text: '  ', confidence: 80, blocks: null } });
    const result = await service.extract({ ...IMAGE, mimeType: 'application/pdf' });
    expect(result.confidence).toBe(0);
    expect(result.regions).toEqual([]);
  });

  it('crea un solo worker en español y lo reutiliza entre solicitudes', async () => {
    await service.extract(IMAGE);
    await service.extract(IMAGE);
    expect(createTesseractWorker).toHaveBeenCalledOnce();
    expect(createTesseractWorker).toHaveBeenCalledWith('4.0.0_best', ['spa']);
  });

  it('propaga un fallo de modelos y reintenta inicializar en la siguiente solicitud', async () => {
    vi.mocked(createTesseractWorker).mockRejectedValueOnce(new Error('missing model'));
    await expect(service.extract(IMAGE)).rejects.toThrow('Tesseract initialization failed');
    expect(mocks.worker.recognize).not.toHaveBeenCalled();
    await expect(service.extract(IMAGE)).resolves.toHaveProperty('engine', 'tesseract');
    expect(createTesseractWorker).toHaveBeenCalledTimes(2);
  });

  it('no depende de la variable OCR_ENGINE del entorno', async () => {
    vi.stubEnv('OCR_ENGINE', 'paddle');
    await expect(service.extract(IMAGE)).resolves.toHaveProperty('engine', 'tesseract');
    vi.unstubAllEnvs();
  });

  it('libera recursos y reinicia el worker tras un error de reconocimiento', async () => {
    mocks.worker.recognize.mockRejectedValueOnce(new Error('inference failed'));
    await expect(service.extract({ ...IMAGE, mimeType: 'application/pdf' })).rejects.toThrow('inference failed');
    expect(mocks.pixmap.destroy).toHaveBeenCalledOnce();
    expect(mocks.page.destroy).toHaveBeenCalledOnce();
    expect(mocks.document.destroy).toHaveBeenCalledOnce();
    expect(mocks.worker.terminate).toHaveBeenCalledOnce();
    await expect(service.extract(IMAGE)).resolves.toHaveProperty('text', 'Nombre leído');
    expect(createTesseractWorker).toHaveBeenCalledTimes(2);
  });

  it('serializa reconocimientos y espera antes de terminar el worker', async () => {
    let active = 0;
    let peak = 0;
    mocks.worker.recognize.mockImplementation(async () => {
      active += 1; peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      expect(mocks.worker.terminate).not.toHaveBeenCalled();
      active -= 1;
      return tesseractResult('Nombre leído', 96);
    });
    const jobs = [service.extract(IMAGE), service.extract(IMAGE)];
    await service.onModuleDestroy();
    await Promise.all(jobs);
    expect(peak).toBe(1);
    expect(mocks.worker.terminate).toHaveBeenCalledOnce();
    await expect(service.extract(IMAGE)).rejects.toThrow('shutting down');
  });
});
