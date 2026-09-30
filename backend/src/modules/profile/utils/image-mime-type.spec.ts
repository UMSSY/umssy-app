import { detectImageMimeType } from './image-mime-type.js';

describe('detectImageMimeType', () => {
  it('detects JPEG images', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);

    expect(detectImageMimeType(bytes)).toBe('image/jpeg');
  });

  it('detects PNG images', () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    expect(detectImageMimeType(bytes)).toBe('image/png');
  });

  it('detects WEBP images', () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);

    expect(detectImageMimeType(bytes)).toBe('image/webp');
  });

  it('returns null for other content', () => {
    expect(detectImageMimeType(new TextEncoder().encode('%PDF-1.7'))).toBe(
      null,
    );
    expect(detectImageMimeType(new Uint8Array([0xff]))).toBe(null);
  });
});
