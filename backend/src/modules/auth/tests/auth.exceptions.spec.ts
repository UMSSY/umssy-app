import { describe, expect, it } from 'vitest';
import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { InvalidCredentialsException, RoleNotAssignedException } from '../exceptions/index.js';

describe('auth exceptions', () => {
  it.each([
    [new InvalidCredentialsException(), 401],
    [new RoleNotAssignedException(), 403],
  ])('%o usa el status esperado', (exception, statusCode) => {
    expect(exception).toBeInstanceOf(DomainException);
    expect(exception.statusCode).toBe(statusCode);
  });
});