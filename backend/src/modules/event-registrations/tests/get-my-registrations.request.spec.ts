import { describe, expect, it } from 'vitest';
import { GetMyRegistrationsSchema } from '../requests/get-my-registrations.request.js';

describe('GetMyRegistrationsSchema', () => {
  it('accepts the finished scope and pagination', () => {
    expect(
      GetMyRegistrationsSchema.parse({
        scope: 'finished',
        page: '2',
        limit: '50',
      }),
    ).toEqual({ scope: 'finished', page: 2, limit: 50 });
  });

  it('accepts an absent scope with default pagination', () => {
    expect(GetMyRegistrationsSchema.parse({})).toEqual({ page: 1, limit: 10 });
  });

  it('rejects an unknown scope', () => {
    expect(GetMyRegistrationsSchema.safeParse({ scope: 'other' }).success).toBe(
      false,
    );
  });

  it.each([0, 51])('rejects limit %i', (limit) => {
    expect(GetMyRegistrationsSchema.safeParse({ limit }).success).toBe(false);
  });

  it('discards a userId from the query', () => {
    expect(
      GetMyRegistrationsSchema.parse({ scope: 'finished', userId: 'other' }),
    ).toEqual({ scope: 'finished', page: 1, limit: 10 });
  });
});
