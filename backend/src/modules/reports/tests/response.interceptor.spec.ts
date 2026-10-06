import {
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from '../interceptors/response.interceptor.js';

function buildContext(statusCode = 200): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    switchToHttp: () => ({ getResponse: () => ({ statusCode }) }),
  } as unknown as ExecutionContext;
}

function buildHandler(data: unknown): CallHandler {
  return { handle: () => of(data) };
}

describe('ResponseInterceptor', () => {
  it('envuelve la respuesta con el mensaje definido en el handler', async () => {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'get').mockReturnValue('Datos obtenidos');
    const interceptor = new ResponseInterceptor(reflector);

    const result = await firstValueFrom(
      interceptor.intercept(buildContext(201), buildHandler(['a'])),
    );

    expect(result).toEqual({
      statusCode: 201,
      data: ['a'],
      detail: 'Datos obtenidos',
      ok: true,
    });
  });

  it('usa un mensaje por defecto y expone la página de los resultados paginados', async () => {
    const interceptor = new ResponseInterceptor(new Reflector());
    const paginated = { items: [], total: 0, page: 3, limit: 10 };

    const result = await firstValueFrom(
      interceptor.intercept(buildContext(), buildHandler(paginated)),
    );

    expect(result).toEqual({
      statusCode: 200,
      data: paginated,
      page: 3,
      detail: 'Solicitud procesada correctamente',
      ok: true,
    });
  });

  it('no agrega página si no es numérica o la respuesta no es un objeto', async () => {
    const interceptor = new ResponseInterceptor(new Reflector());

    const withTextPage = await firstValueFrom(
      interceptor.intercept(buildContext(), buildHandler({ page: 'x' })),
    );
    const withNull = await firstValueFrom(
      interceptor.intercept(buildContext(), buildHandler(null)),
    );

    expect(withTextPage).not.toHaveProperty('page');
    expect(withNull).not.toHaveProperty('page');
  });

  it('deja pasar los archivos sin envolverlos en el formato JSON', async () => {
    const interceptor = new ResponseInterceptor(new Reflector());
    const file = new StreamableFile(Buffer.from('a,b'));

    const result = await firstValueFrom(
      interceptor.intercept(buildContext(), buildHandler(file)),
    );

    expect(result).toBe(file);
  });
});
