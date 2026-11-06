import { afterEach, describe, expect, it, vi } from 'vitest';
import * as mupdf from 'mupdf';
import { access } from 'node:fs/promises';
import { createWorker } from 'tesseract.js';
import { DocumentSkillTextExtractorService } from '../services/document-skill-text-extractor.service.js';
import { NLP_DOCUMENT_LIMITS, NLP_DOCUMENT_READ_ERROR } from '../constants/nlp-document.constants.js';

vi.mock('tesseract.js', () => ({ createWorker: vi.fn(), OEM: { LSTM_ONLY: 1 } }));
vi.mock('node:fs/promises', () => ({ access: vi.fn().mockResolvedValue(undefined) }));

function fixture(format: 'pdf' | 'png' | 'jpeg' = 'pdf', pages = 1) {
  const document = new mupdf.PDFDocument();
  const font = new mupdf.Font('Helvetica');
  const fontRef = document.addSimpleFont(font);
  try {
    for (let index = 0; index < pages; index += 1) {
      const ref = document.addPage([0, 0, 600, 200], 0, { Font: { F1: fontRef } }, 'BT /F1 28 Tf 30 100 Td (Python Docker React) Tj ET');
      document.insertPage(-1, ref);
      ref.destroy();
    }
    if (format === 'pdf') {
      const buffer = document.saveToBuffer({});
      try { return Buffer.from(buffer.asUint8Array()); }
      finally { buffer.destroy(); }
    }
    const page = document.loadPage(0);
    const pixmap = page.toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false, true);
    try { return Buffer.from(format === 'png' ? pixmap.asPNG() : pixmap.asJPEG(90)); }
    finally { pixmap.destroy(); page.destroy(); }
  } finally { fontRef.destroy(); font.destroy(); document.destroy(); }
}

afterEach(() => { vi.resetAllMocks(); vi.mocked(access).mockResolvedValue(undefined); vi.useRealTimers(); });

describe('DocumentSkillTextExtractorService', () => {
  it('extracts real embedded PDF text without OCR', async () => {
    const service = new DocumentSkillTextExtractorService();
    await expect(service.extract(fixture(), 'application/pdf')).resolves.toContain('Python Docker React');
    expect(createWorker).not.toHaveBeenCalled();
  });

  it.each(['png', 'jpeg'] as const)('reads %s via OCR, terminates the worker and caches only extracted text', async (format) => {
    const worker = { recognize: vi.fn().mockResolvedValue({ data: { text: 'Python Docker React' } }), terminate: vi.fn() };
    vi.mocked(createWorker).mockResolvedValue(worker as never);
    const service = new DocumentSkillTextExtractorService();
    const content = fixture(format);
    await expect(service.extract(content, `image/${format}`)).resolves.toBe('Python Docker React');
    await expect(service.extract(content, `image/${format}`)).resolves.toBe('Python Docker React');
    expect(worker.recognize).toHaveBeenCalledExactlyOnceWith(content);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(createWorker).toHaveBeenCalledWith(['spa', 'eng'], 1, expect.objectContaining({ errorHandler: expect.any(Function), cacheMethod: 'none' }));
  });

  it('rejects unsupported, empty, oversized or corrupt files', async () => {
    const service = new DocumentSkillTextExtractorService();
    await expect(service.extract(Buffer.alloc(0), 'application/pdf')).rejects.toThrow(NLP_DOCUMENT_READ_ERROR);
    await expect(service.extract(Buffer.from('text'), 'text/plain')).rejects.toThrow(NLP_DOCUMENT_READ_ERROR);
    await expect(service.extract(Buffer.alloc(NLP_DOCUMENT_LIMITS.maxBytes + 1), 'application/pdf')).rejects.toThrow(NLP_DOCUMENT_READ_ERROR);
    await expect(service.extract(Buffer.from('corrupt'), 'application/pdf')).rejects.toThrow();
    expect(createWorker).not.toHaveBeenCalled();
  });

  it('rejects PDFs beyond the page limit without OCR', async () => {
    await expect(new DocumentSkillTextExtractorService().extract(fixture('pdf', 11), 'application/pdf')).rejects.toThrow(NLP_DOCUMENT_READ_ERROR);
    expect(createWorker).not.toHaveBeenCalled();
  });

  it('fails safely before starting a worker if local models are missing', async () => {
    vi.mocked(access).mockRejectedValue(new Error('missing local model'));
    await expect(new DocumentSkillTextExtractorService().extract(fixture('png'), 'image/png')).rejects.toThrow('missing local model');
    expect(createWorker).not.toHaveBeenCalled();
  });

  it('does not cache OCR failures and allows a subsequent retry', async () => {
    const worker = { recognize: vi.fn().mockRejectedValueOnce(new Error('OCR failed')).mockResolvedValue({ data: { text: 'Python' } }), terminate: vi.fn() };
    vi.mocked(createWorker).mockResolvedValue(worker as never);
    const service = new DocumentSkillTextExtractorService();
    const content = fixture('png');
    await expect(service.extract(content, 'image/png')).rejects.toThrow('OCR failed');
    await expect(service.extract(content, 'image/png')).resolves.toBe('Python');
    expect(worker.terminate).toHaveBeenCalledTimes(2);
  });

  it('terminates a timed-out OCR worker instead of leaving the analysis running', async () => {
    vi.useFakeTimers();
    const worker = { recognize: vi.fn(() => new Promise(() => undefined)), terminate: vi.fn() };
    vi.mocked(createWorker).mockResolvedValue(worker as never);
    const result = new DocumentSkillTextExtractorService().extract(fixture('png'), 'image/png');
    const assertion = expect(result).rejects.toThrow(NLP_DOCUMENT_READ_ERROR);
    await vi.advanceTimersByTimeAsync(NLP_DOCUMENT_LIMITS.timeoutMs);
    await assertion;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
