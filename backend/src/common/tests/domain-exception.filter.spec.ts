import { describe, expect, it, vi } from 'vitest';
import type { ArgumentsHost } from '@nestjs/common';
import { DomainException } from '../exceptions/domain.exception.js';
import { DomainExceptionFilter } from '../filters/domain-exception.filter.js';

class TestDomainException extends DomainException {
  constructor() {
    super('Error de prueba', 418);
  }
}

// Construye un host falso que expone un response con mocks de status y json.
function buildHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  it('responde con el formato estandar y el status de la excepcion', () => {
    const { host, status, json } = buildHost();

    new DomainExceptionFilter().catch(new TestDomainException(), host);

    expect(status).toHaveBeenCalledWith(418);
    expect(json).toHaveBeenCalledWith({
      statusCode: 418,
      data: null,
      detail: 'Error de prueba',
      ok: false,
    });
  });
});
