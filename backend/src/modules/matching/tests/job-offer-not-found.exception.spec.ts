import { describe, expect, it } from 'vitest';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JobOfferNotFoundException } from '../exceptions/index.js';

describe('JobOfferNotFoundException', () => {
  it('es una excepción de dominio 404 con un mensaje claro', () => {
    const exception = new JobOfferNotFoundException();

    expect(exception).toBeInstanceOf(DomainException);
    expect(exception.statusCode).toBe(404);
    expect(exception.message).toBe('La vacante no existe o no está publicada.');
  });
});
