import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  type ArgumentsHost,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
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
  const filter = new HttpExceptionFilter();

  it('responde con el mensaje de una excepción HTTP', () => {
    const { host, status, json } = buildHost();

    filter.catch(new NotFoundException('Reporte no encontrado'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      data: null,
      detail: 'Reporte no encontrado',
      ok: false,
    });
  });

  it('une los mensajes cuando vienen en una lista', () => {
    const { host, json } = buildHost();

    filter.catch(new BadRequestException(['campo a', 'campo b']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, detail: 'campo a; campo b' }),
    );
  });

  it('indica el campo inválido en los errores de validación de Zod', () => {
    const { host, status, json } = buildHost();
    const result = z
      .object({ page: z.coerce.number().int().min(1) })
      .safeParse({ page: '0' });

    filter.catch(new ZodValidationException(result.error), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        detail: expect.stringContaining('page:'),
        ok: false,
      }),
    );
  });

  it('usa la respuesta cuando es texto o el mensaje de la excepción si no hay otro', () => {
    const textHost = buildHost();
    filter.catch(
      new HttpException('Texto plano', HttpStatus.CONFLICT),
      textHost.host,
    );
    expect(textHost.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, detail: 'Texto plano' }),
    );

    const objectHost = buildHost();
    filter.catch(
      new HttpException({ code: 'X' }, HttpStatus.FORBIDDEN),
      objectHost.host,
    );
    expect(objectHost.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403, ok: false }),
    );
  });

  it('oculta el detalle de errores inesperados y los registra', () => {
    const { host, status, json } = buildHost();
    const logSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    filter.catch(new Error('fallo interno'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      data: null,
      detail: 'Ocurrió un error interno en el servidor',
      ok: false,
    });
    expect(logSpy).toHaveBeenCalled();
  });
});
