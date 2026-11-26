import { describe, expect, it } from 'vitest';
import { companyRequestCodeParamsSchema } from '../requests/company-request-code.schema.js';

describe('companyRequestCodeParamsSchema', () => {
  it('acepta códigos EMP-AAAA-NNNN y los normaliza', () => {
    expect(companyRequestCodeParamsSchema.parse({ code: ' emp-2026-0001 ' })).toEqual({
      code: 'EMP-2026-0001',
    });
    expect(companyRequestCodeParamsSchema.parse({ code: 'EMP-2026-12345' }).code).toBe('EMP-2026-12345');
  });

  it.each(['SOL-2026-0001', 'EMP-26-0001', 'EMP-2026-1', 'EMP-2026-ABCD', '', 'EMP-2026-0001; DROP'])(
    'rechaza %j',
    (code) => {
      expect(companyRequestCodeParamsSchema.safeParse({ code }).success).toBe(false);
    },
  );

  it('exige el código', () => {
    const result = companyRequestCodeParamsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
