// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getProposalSupportErrorMessage } from './proposal-support-error';

function apiError(code: string, status: number) {
  return {
    isAxiosError: true,
    response: {
      status,
      data: {
        statusCode: status,
        ok: false,
        code,
        detail: 'Mensaje privado del servidor',
        data: null,
      },
    },
  };
}

describe('proposal support errors', () => {
  it.each([
    ['UNAUTHENTICATED', 401, 'Debes iniciar sesión para apoyar una propuesta.'],
    ['FORBIDDEN_ROLE', 403, 'Solo los usuarios con perfil Titulado pueden apoyar propuestas.'],
    ['ALREADY_SUPPORTED', 409, 'Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.'],
    ['PROPOSAL_EXPIRED', 409, 'La propuesta ya venció.'],
    ['EVENT_NOT_SUPPORTABLE', 409, 'La propuesta ya no acepta apoyos. Actualiza su estado.'],
    ['EVENT_NOT_FOUND', 404, 'No encontramos la propuesta solicitada.'],
  ])('maps backend code %s to a safe message', (code, status, message) => {
    expect(getProposalSupportErrorMessage(apiError(code, status))).toBe(message);
  });

  it('uses a retryable fallback for network errors or unknown codes', () => {
    const fallback = 'No pudimos registrar tu apoyo. Revisa la conexión e inténtalo nuevamente.';
    expect(getProposalSupportErrorMessage(new Error('offline'))).toBe(fallback);
    expect(getProposalSupportErrorMessage(apiError('UNKNOWN_CODE', 500))).toBe(fallback);
  });
});
