import { describe, expect, it } from 'vitest';
import {
  AttendanceCheckInBodySchema,
  AttendanceCheckInParamsSchema,
} from '../requests/attendance-check-in.request.js';

const TOKEN = 'a'.repeat(64);

describe('attendance check-in request contract', () => {
  it.each([TOKEN, `v1:${TOKEN}`, `V1:${TOKEN.toUpperCase()}`])(
    'accepts a real pass reference and normalizes it without exposing the prefix',
    (reference) => {
      expect(AttendanceCheckInBodySchema.parse({ reference })).toEqual({
        reference: TOKEN,
      });
    },
  );

  it.each([
    '', 'v1:', 'abc', 'K7M4-R9TX-2Q8P',
    '11111111-2222-4333-8444-555555555555',
    '<script>alert(1)</script>', `v2:${TOKEN}`, `${TOKEN}extra`,
  ])('rejects an unsupported or malformed reference: %s', (reference) => {
    expect(AttendanceCheckInBodySchema.safeParse({ reference }).success).toBe(false);
  });

  it('rejects caller-supplied identities and non-UUID workshop ids', () => {
    expect(AttendanceCheckInBodySchema.safeParse({ reference: TOKEN, userId: 'other' }).success).toBe(false);
    expect(AttendanceCheckInBodySchema.safeParse({ reference: 42 }).success).toBe(false);
    expect(AttendanceCheckInParamsSchema.safeParse({ eventId: 'not-a-uuid' }).success).toBe(false);
  });
});
