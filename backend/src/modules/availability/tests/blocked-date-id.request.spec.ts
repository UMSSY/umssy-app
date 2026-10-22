import { describe, expect, it } from 'vitest';
import { BLOCKED_DATE_MESSAGES as MSG } from '../constants/blocked-date.constants.js';
import { blockedDateIdSchema } from '../requests/blocked-date-id.request.js';

describe('blockedDateIdSchema', () => {
  it('acepta un UUID', () => {
    expect(blockedDateIdSchema.safeParse('b0800002-0000-4000-8000-000000000001').success).toBe(true);
  });

  it('rechaza un id que no es UUID', () => {
    const result = blockedDateIdSchema.safeParse('fecha-1');
    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual([MSG.invalidId]);
  });
});
