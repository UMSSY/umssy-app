import { describe, expect, it } from 'vitest';
import { cvIdSchema } from '../requests/cv-id.request.js';
import { listCvsSchema } from '../requests/list-cvs.request.js';

describe('cv requests', () => {
  describe('listCvsSchema', () => {
    it('defaults to the first page of the five newest cvs', () => {
      expect(listCvsSchema.parse({})).toEqual({ page: 1, limit: 5 });
    });

    it('coerces the query string values to numbers', () => {
      expect(listCvsSchema.parse({ page: '3', limit: '20' })).toEqual({ page: 3, limit: 20 });
    });

    it.each([
      { page: '0' },
      { limit: '0' },
      { limit: '101' },
      { page: '1.5' },
      { page: 'abc' },
    ])('rejects the invalid query %o', (query) => {
      expect(listCvsSchema.safeParse(query).success).toBe(false);
    });
  });

  describe('cvIdSchema', () => {
    it('accepts a uuid', () => {
      expect(cvIdSchema.safeParse('22222222-2222-4222-8222-222222222222').success).toBe(true);
    });

    it('rejects a value that is not a uuid', () => {
      expect(cvIdSchema.safeParse('not-a-uuid').success).toBe(false);
    });
  });
});
