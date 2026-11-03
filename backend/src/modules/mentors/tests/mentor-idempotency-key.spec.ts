import { describe, expect, it } from 'vitest';
import { requireMentorIdempotencyKey } from '../requests/mentor-idempotency-key.schema.js';

describe('cabecera de idempotencia de incorporación', () => {
  it.each([
    undefined,
    '',
    'invalid',
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
  ])('rechaza %s mediante el contrato de dominio', (key) => {
    expect(() => requireMentorIdempotencyKey(key)).toThrow(
      expect.objectContaining({
        statusCode: 400,
        data: { code: 'INVALID_IDEMPOTENCY_KEY' },
      }),
    );
  });
  it('normaliza mayúsculas sin sustituir una intención válida', () => {
    expect(
      requireMentorIdempotencyKey('ABCDEFAB-1234-4234-8234-ABCDEFABCDEF'),
    ).toBe('abcdefab-1234-4234-8234-abcdefabcdef');
  });
});
