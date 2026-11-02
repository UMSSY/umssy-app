import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createWorker } from 'tesseract.js';
import { recognizeWithTesseract } from './tesseract-ocr.js';

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
  OEM: { LSTM_ONLY: 1 },
}));

describe('Tesseract worker lifecycle', () => {
  beforeEach(() => vi.resetAllMocks());

  it('releases its worker after successful recognition', async () => {
    const terminate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(createWorker).mockResolvedValue({
      recognize: vi
        .fn()
        .mockResolvedValue({ data: { text: 'Hola', confidence: 92 } }),
      terminate,
    } as unknown as Awaited<ReturnType<typeof createWorker>>);
    await expect(recognizeWithTesseract(Buffer.from('image'))).resolves.toEqual(
      {
        text: 'Hola',
        confidence: 92,
        model: 'default',
      },
    );
    expect(terminate).toHaveBeenCalledOnce();
  });

  it('releases its worker when recognition fails', async () => {
    const terminate = vi.fn().mockResolvedValue(undefined);
    vi.mocked(createWorker).mockResolvedValue({
      recognize: vi.fn().mockRejectedValue(new Error('Invalid image')),
      terminate,
    } as unknown as Awaited<ReturnType<typeof createWorker>>);
    await expect(
      recognizeWithTesseract(Buffer.from('image'), '4.0.0_best'),
    ).rejects.toThrow('Invalid image');
    expect(terminate).toHaveBeenCalledOnce();
  });
});
