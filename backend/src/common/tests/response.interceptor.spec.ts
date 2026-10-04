import { describe, expect, it } from 'vitest';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from '../interceptors/response.interceptor.js';

function buildContext(statusCode = 200): ExecutionContext {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

function buildCallHandler(value: unknown): CallHandler {
  return {
    handle: () => of(value),
  };
}

describe('ResponseInterceptor', () => {
  it('envuelve una respuesta simple en el sobre estandar', async () => {
    const interceptor = new ResponseInterceptor();
    const result = await new Promise((resolve) => {
      interceptor
        .intercept(buildContext(), buildCallHandler('Hola'))
        .subscribe(resolve);
    });

    expect(result).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'Operación exitosa',
      data: 'Hola',
    });
  });

  it('promueve page y offset al nivel raiz para respuestas paginadas', async () => {
    const interceptor = new ResponseInterceptor();
    const paginated = { data: [{ id: '1' }], page: 2, offset: 10 };
    const result = await new Promise((resolve) => {
      interceptor
        .intercept(buildContext(), buildCallHandler(paginated))
        .subscribe(resolve);
    });

    expect(result).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'Operación exitosa',
      data: [{ id: '1' }],
      page: 2,
      offset: 10,
    });
  });

  it('promueve page y offset al nivel raiz para respuestas paginadas cuando data es un objeto', async () => {
    const interceptor = new ResponseInterceptor();
    const paginated = {
      data: { items: [{ id: '1' }], total: 10, limit: 5, totalPages: 2 },
      page: 2,
      offset: 5,
    };
    const result = await new Promise((resolve) => {
      interceptor
        .intercept(buildContext(), buildCallHandler(paginated))
        .subscribe(resolve);
    });

    expect(result).toEqual({
      statusCode: 200,
      ok: true,
      detail: 'Operación exitosa',
      data: { items: [{ id: '1' }], total: 10, limit: 5, totalPages: 2 },
      page: 2,
      offset: 5,
    });
  });

  it('no vuelve a envolver respuestas ya formateadas', async () => {
    const interceptor = new ResponseInterceptor();
    const alreadyFormatted = {
      statusCode: 201,
      ok: true,
      detail: 'Creado',
      data: { id: 'abc' },
    };
    const result = await new Promise((resolve) => {
      interceptor
        .intercept(buildContext(201), buildCallHandler(alreadyFormatted))
        .subscribe(resolve);
    });

    expect(result).toEqual(alreadyFormatted);
  });
});
