import { describe, expect, it } from 'vitest';
import { CompanyRegistrationConflictException } from '../exceptions/company-registration-conflict.exception.js';

describe('CompanyRegistrationConflictException', () => {
  it('instantiates with message, 409 status and code', () => {
    const error = new CompanyRegistrationConflictException('Conflicto detectado');
    expect(error.message).toBe('Conflicto detectado');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('COMPANY_REGISTRATION_CONFLICT');
    expect(error.field).toBeUndefined();
    expect(error.data).toBeNull();
  });

  it('instantiates with field detail', () => {
    const error = new CompanyRegistrationConflictException(
      'El correo ya está registrado',
      'email',
    );
    expect(error.field).toBe('email');
    expect(error.data).toEqual({ field: 'email' });
  });
});
