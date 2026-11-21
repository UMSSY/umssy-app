import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array } from './url-base64-to-uint8-array';

describe('urlBase64ToUint8Array', () => {
  it('converts a URL-safe base64 string into a Uint8Array', () => {
    const result = urlBase64ToUint8Array('SGVsbG8');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(5);
    expect(String.fromCharCode(...result)).toBe('Hello');
  });

  it('handles URL-safe characters (- and _)', () => {
    const result = urlBase64ToUint8Array('SGVsbG8-V29ybGQ_');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});