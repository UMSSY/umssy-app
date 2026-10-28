import { describe, expect, it, vi } from 'vitest';
import type { ArgumentsHost } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { HTTP_ERRORS } from '../constants/http-errors.constants.js';
import { DomainException } from '../exceptions/domain.exception.js';
import { RequestValidationException } from '../exceptions/request-validation.exception.js';
import { DomainExceptionFilter } from '../filters/domain-exception.filter.js';

class TestDomainException extends DomainException {
  constructor() {
    super('Error de prueba', 418, 'TEST_ERROR');
  }
}

function buildHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  it('normalizes Zod validation errors without losing field messages or nested paths', () => {
    const { host, status, json } = buildHost();
    const result = z.object({
      email: z.string().min(1, 'Email required'),
      contacts: z.array(z.object({ name: z.string().min(1, 'Name required') })),
    }).safeParse({ email: '', contacts: [{ name: '' }] });
    if (result.success) throw new Error('Expected invalid fixture');
    const errors = [
      { field: 'email', message: 'Email required' },
      { field: 'contacts.0.name', message: 'Name required' },
    ];

    new DomainExceptionFilter().catch(new ZodValidationException(result.error), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: HTTP_ERRORS[400].code,
      data: errors,
      detail: 'email: Email required; contacts.0.name: Name required',
      ok: false,
      errors,
    });
  });

  it('responde con el formato estandar y el status de la excepcion', () => {
    const { host, status, json } = buildHost();

    new DomainExceptionFilter().catch(new TestDomainException(), host);

    expect(status).toHaveBeenCalledWith(418);
    expect(json).toHaveBeenCalledWith({
      statusCode: 418,
      code: 'TEST_ERROR',
      data: null,
      detail: 'Error de prueba',
      ok: false,
    });
  });

  it('returns the structured validation errors in data', () => {
    const { host, status, json } = buildHost();
    const errors = [{ field: 'email', message: 'Invalid email' }];

    new DomainExceptionFilter().catch(new RequestValidationException(errors), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      data: errors,
      detail: 'email: Invalid email',
      ok: false,
      errors,
    });
  });
});
