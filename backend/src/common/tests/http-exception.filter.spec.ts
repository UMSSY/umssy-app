import { describe, expect, it, vi } from 'vitest';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { HttpExceptionFilter } from '../filters/http-exception.filter.js';

function buildHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  it('responde con el formato estandar para BadRequestException con string', () => {
    const { host, status, json } = buildHost();
    const exception = new HttpException('Solicitud invalida', 400);

    new HttpExceptionFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      ok: false,
      detail: 'Solicitud invalida',
      data: null,
    });
  });

  it('extrae el mensaje cuando la respuesta es un objeto con message', () => {
    const { host, status, json } = buildHost();
    const exception = new HttpException({ message: 'campo: es requerido', error: 'Bad Request', statusCode: 400 }, 400);

    new HttpExceptionFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      ok: false,
      detail: 'campo: es requerido',
      data: null,
    });
  });

  it('usa mensaje por defecto cuando el body no tiene message', () => {
    const { host, json } = buildHost();
    const exception = new HttpException({ code: 'ERR' }, 500);

    new HttpExceptionFilter().catch(exception, host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ detail: 'Error en la solicitud' }),
    );
  });
});
