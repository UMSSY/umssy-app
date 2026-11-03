import { describe, expect, it, vi } from 'vitest';
import { createPaddleWorker, recognizeWithPaddle } from './paddle-ocr.js';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockImplementation((path: string) => {
    if (path.endsWith('.txt')) {
      return Promise.resolve('line1\nline2');
    }
    return Promise.resolve(Buffer.from('model-buffer'));
  }),
}));

vi.mock('paddleocr', () => ({
  PaddleOcrService: {
    createInstance: vi.fn().mockResolvedValue({
      recognize: vi.fn().mockResolvedValue([
        { text: 'Line 1', confidence: 0.95 },
        { text: 'Line 2', confidence: 0.85 },
      ]),
    }),
  },
}));

vi.mock('onnxruntime-node', () => ({
  default: {},
}));

describe('PaddleOCR wrapper', () => {
  it('creates instance with parsed dictionary and model buffers', async () => {
    const worker = await createPaddleWorker({
      detection: 'det.onnx',
      recognition: 'rec.onnx',
      dictionary: 'dict.txt',
      preset: 'PP-OCRv5_mobile',
    });
    expect(worker).toBeDefined();
  });

  it('formats recognized text and computes average confidence', async () => {
    const fakeWorker = {
      recognize: vi.fn().mockResolvedValue([
        { text: 'UNIVERSIDAD MAYOR DE SAN SIMON', confidence: 0.98 },
        { text: 'DIPLOMA ACADEMICO', confidence: 0.92 },
      ]),
    };
    const input = {
      width: 100,
      height: 100,
      data: new Uint8Array(100 * 100 * 3),
    };

    const result = await recognizeWithPaddle(fakeWorker as never, input);
    expect(result.text).toBe('UNIVERSIDAD MAYOR DE SAN SIMON\nDIPLOMA ACADEMICO');
    expect(result.confidence).toBeCloseTo(0.95);
  });

  it('handles empty results gracefully', async () => {
    const fakeWorker = {
      recognize: vi.fn().mockResolvedValue([]),
    };
    const input = {
      width: 10,
      height: 10,
      data: new Uint8Array(10 * 10 * 3),
    };

    const result = await recognizeWithPaddle(fakeWorker as never, input);
    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
  });
});
