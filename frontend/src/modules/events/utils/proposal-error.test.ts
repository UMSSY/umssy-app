import { describe, expect, it } from 'vitest';
import { getProposalError } from './proposal-error';

function apiError(errors: unknown) {
  return { isAxiosError: true, response: { status: 400, data: { code: 'VALIDATION_ERROR', errors } } };
}

describe('proposal field errors', () => {
  it('reads field and message entries returned by the shared backend filter', () => {
    expect(getProposalError(apiError([
      { field: 'title', message: 'Ingresa un título.' },
      { field: 'categoryId', message: 'Selecciona una categoría disponible.' },
      { field: 'endTime', message: 'La finalización debe ser posterior al inicio.' },
    ])).fields).toEqual({ title: 'Ingresa un título.', categoryId: 'Selecciona una categoría disponible.', endTime: 'La finalización debe ser posterior al inicio.' });
  });
  it('preserves compatibility with the previous field dictionary', () => {
    expect(getProposalError(apiError({ title: 'Título requerido', cover: 'Portada requerida' })).fields).toEqual({ title: 'Título requerido', cover: 'Portada requerida' });
  });
  it('ignores invalid entries and unknown fields without crashing', () => {
    expect(getProposalError(apiError([null, 'invalid', { field: 'title', message: 123 }, { field: 'idempotencyKey', message: 'Clave inválida' }])).fields).toEqual({});
    expect(getProposalError(apiError(null)).message).toBe('Revisa los datos de la propuesta e inténtalo nuevamente.');
  });
});
