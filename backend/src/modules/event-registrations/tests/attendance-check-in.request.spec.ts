import { describe, expect, it } from 'vitest';
import {
  AttendanceCheckInBodySchema,
  AttendanceCheckInParamsSchema,
} from '../requests/attendance-check-in.request.js';
import {
  ATTENDANCE_CHECK_IN_ERROR_RESPONSES,
  ATTENDANCE_REFERENCE_PATTERNS,
} from '../constants/attendance-check-in-swagger.constants.js';
import { AttendanceAccessDeniedException } from '../exceptions/attendance-access-denied.exception.js';
import { AttendancePassCancelledException } from '../exceptions/attendance-pass-cancelled.exception.js';
import { AttendancePassInvalidException } from '../exceptions/attendance-pass-invalid.exception.js';
import { AttendanceOutsideWindowException } from '../exceptions/attendance-outside-window.exception.js';

const TOKEN = 'a'.repeat(64);
const REGISTRATION_ID = '11111111-2222-4333-8444-555555555555';

describe('attendance check-in request contract', () => {
  it.each([TOKEN, `v1:${TOKEN}`, `V1:${TOKEN.toUpperCase()}`])(
    'accepts a real pass QR or token and normalizes it without exposing the prefix',
    (reference) => {
      expect(AttendanceCheckInBodySchema.parse({ reference })).toEqual({
        reference: { kind: 'qrToken', value: TOKEN },
      });
    },
  );

  it('accepts a registration UUID as a manual reference', () => {
    expect(AttendanceCheckInBodySchema.parse({ reference: ` ${REGISTRATION_ID.toUpperCase()} ` })).toEqual({
      reference: { kind: 'registrationId', value: REGISTRATION_ID },
    });
  });

  it.each([
    '', 'v1:', 'abc', 'K7M4-R9TX-2Q8P',
    '11111111-2222-3333-4444-55555555555',
    '<script>alert(1)</script>', `v2:${TOKEN}`, `${TOKEN}extra`,
  ])('rejects an unsupported or malformed reference: %s', (reference) => {
    expect(AttendanceCheckInBodySchema.safeParse({ reference }).success).toBe(false);
  });

  it('rejects caller-supplied identities and non-UUID workshop ids', () => {
    expect(AttendanceCheckInBodySchema.safeParse({ reference: TOKEN, userId: 'other' }).success).toBe(false);
    expect(AttendanceCheckInBodySchema.safeParse({ reference: 42 }).success).toBe(false);
    expect(AttendanceCheckInParamsSchema.safeParse({ eventId: 'not-a-uuid' }).success).toBe(false);
  });

  it.each([
    TOKEN, `v1:${TOKEN}`, `  V1:${TOKEN.toUpperCase()}\t`, ` ${REGISTRATION_ID} `, `\n${TOKEN}\n`,
    '', 'v1:', 'abc', 'K7M4-R9TX-2Q8P', `v2:${TOKEN}`, `${TOKEN}extra`, `v1: ${TOKEN}`,
    '11111111-2222-3333-4444-55555555555',
  ])('documents in Swagger exactly the references Zod accepts: %j', (reference) => {
    const documented = Object.values(ATTENDANCE_REFERENCE_PATTERNS).some((pattern) =>
      new RegExp(pattern).test(reference),
    );
    expect(documented).toBe(AttendanceCheckInBodySchema.safeParse({ reference }).success);
  });

  it('documents the real detail of every attendance error', () => {
    const documented = ATTENDANCE_CHECK_IN_ERROR_RESPONSES.flatMap((response) =>
      'content' in response
        ? Object.values(response.content?.['application/json']?.examples ?? {}).map(
            (example) => ('value' in example ? example.value : undefined),
          )
        : [],
    );
    for (const error of [
      new AttendanceAccessDeniedException(),
      new AttendanceOutsideWindowException(),
      new AttendancePassInvalidException(),
      new AttendancePassCancelledException(),
    ]) {
      expect(documented).toContainEqual(
        expect.objectContaining({ code: error.code, detail: error.message }),
      );
    }
  });
});
