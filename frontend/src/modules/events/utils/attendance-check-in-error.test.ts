import { describe, expect, it, vi } from 'vitest';
import { getAttendanceCheckInError } from './attendance-check-in-error';
import { AttendanceSessionRequiredError } from './attendance-session-required.error';

vi.mock('@/shared/services/api-client', () => ({
  isApiError: (error: unknown) =>
    Boolean(error && typeof error === 'object' && 'isAxiosError' in error),
}));

describe('getAttendanceCheckInError', () => {
  it.each([
    [422, 'ATTENDANCE_PASS_INVALID', 'invalid'],
    [422, 'ATTENDANCE_PASS_CANCELLED', 'invalid'],
    [400, 'VALIDATION_ERROR', 'invalid'],
    [401, 'UNAUTHENTICATED', 'error'],
    [403, 'ATTENDANCE_ACCESS_DENIED', 'error'],
    [409, 'ATTENDANCE_OUTSIDE_WINDOW', 'error'],
  ] as const)('maps %i %s to a safe %s state', (status, code, kind) => {
    const secret = `v1:${'a'.repeat(64)}`;
    const result = getAttendanceCheckInError({
      isAxiosError: true,
      response: { status, data: { code, detail: secret } },
    });
    expect(result.kind).toBe(kind);
    expect(result.message).not.toContain(secret);
  });

  it('handles missing session, network failures and unknown server details without displaying them', () => {
    expect(
      getAttendanceCheckInError(new AttendanceSessionRequiredError()).message,
    ).toContain('Inicia sesión');
    expect(getAttendanceCheckInError({ isAxiosError: true }).message).toContain(
      'conexión',
    );
    expect(
      getAttendanceCheckInError({
        isAxiosError: true,
        response: { status: 500, data: { detail: 'private token' } },
      }).message,
    ).not.toContain('private token');
  });

  it('uses the agreed messages for cancelled passes and closed attendance windows', () => {
    const cancelled = getAttendanceCheckInError({
      isAxiosError: true,
      response: { status: 422, data: { code: 'ATTENDANCE_PASS_CANCELLED' } },
    });
    const closed = getAttendanceCheckInError({
      isAxiosError: true,
      response: { status: 409, data: { code: 'ATTENDANCE_OUTSIDE_WINDOW' } },
    });
    expect(cancelled.message).toContain('Pase inválido - Inscripción cancelada');
    expect(closed.message).toContain('Fuera de la ventana horaria de validación');
  });
});
