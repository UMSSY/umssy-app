import { Controller, Get, type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  apiAuthResponses,
  apiErrorResponse,
} from '../decorators/api-error-response.decorator.js';
import { apiSuccessResponse } from '../decorators/api-success-response.decorator.js';
import { apiArray, apiObject, apiString } from '../utils/api-schema.js';

interface DocumentedSchema {
  required: string[];
  properties: Record<string, { enum?: string[] }>;
  example: Record<string, unknown>;
}

interface DocumentedResponse {
  description: string;
  schema: DocumentedSchema;
}

@Controller('probe')
class ProbeController {
  @Get('success')
  @apiSuccessResponse({
    status: 200,
    description: 'Lista de habilidades',
    data: apiArray(apiObject({ name: apiString('NestJS') })),
  })
  success(): void {}

  @Get('success-detail')
  @apiSuccessResponse({
    status: 200,
    description: 'Con detalle propio',
    data: apiObject({ name: apiString('NestJS') }),
    detail: 'OK',
  })
  successWithDetail(): void {}

  @Get('validation')
  @apiErrorResponse({
    status: 400,
    description: 'Datos inválidos',
    validation: [{ field: 'text', message: 'Texto demasiado largo' }],
    errors: [{ code: 'OTHER_ERROR', detail: 'Otro motivo' }],
  })
  validation(): void {}

  @Get('not-found')
  @apiErrorResponse({
    status: 404,
    description: 'No existe',
    errors: [{ code: 'NOT_FOUND_ERROR', detail: 'No existe' }],
  })
  notFound(): void {}

  @Get('secured')
  @apiAuthResponses({
    roles: ['titulado', 'estudiante'],
    forbidden: [{ code: 'OWNER_ERROR', detail: 'No es tuya' }],
  })
  secured(): void {}

  @Get('authenticated-only')
  @apiAuthResponses()
  authenticatedOnly(): void {}
}

describe('Documentación de respuestas en Swagger', () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  function responseOf(path: string, status: number): DocumentedResponse {
    const response = document.paths[`/probe/${path}`]?.get?.responses[
      status
    ] as unknown as {
      description: string;
      content: Record<string, { schema: DocumentedSchema }>;
    };
    const [content] = Object.values(response.content);
    return { description: response.description, schema: content.schema };
  }

  describe('apiSuccessResponse', () => {
    it('envuelve los datos en el formato estándar de respuesta', () => {
      const { description, schema } = responseOf('success', 200);

      expect(description).toBe('Lista de habilidades');
      expect(schema.required).toEqual(['statusCode', 'ok', 'detail', 'data']);
      expect(schema.example).toEqual({
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: [{ name: 'NestJS' }],
      });
    });

    it('permite cambiar el detalle de la respuesta', () => {
      expect(responseOf('success-detail', 200).schema.example.detail).toBe(
        'OK',
      );
    });
  });

  describe('apiErrorResponse', () => {
    it('documenta la validación y los demás códigos con el ejemplo de la validación', () => {
      const { description, schema } = responseOf('validation', 400);

      expect(schema.properties.code.enum).toEqual([
        'VALIDATION_ERROR',
        'OTHER_ERROR',
      ]);
      expect(schema.example).toEqual({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        data: [{ field: 'text', message: 'Texto demasiado largo' }],
        detail: 'text: Texto demasiado largo',
        ok: false,
        errors: [{ field: 'text', message: 'Texto demasiado largo' }],
      });
      expect(description).toContain('`OTHER_ERROR`: Otro motivo');
    });

    it('documenta un error de dominio con datos nulos y sin lista de errores', () => {
      const { schema } = responseOf('not-found', 404);

      expect(schema.example).toEqual({
        statusCode: 404,
        code: 'NOT_FOUND_ERROR',
        data: null,
        detail: 'No existe',
        ok: false,
      });
      expect(schema.properties).not.toHaveProperty('errors');
    });

    it('exige al menos un error', () => {
      expect(() =>
        apiErrorResponse({ status: 400, description: 'Vacío' }),
      ).toThrow();
    });
  });

  describe('apiAuthResponses', () => {
    it('documenta 401 y un 403 con el rol, el acceso propio y la cuenta inactiva', () => {
      const unauthorized = responseOf('secured', 401);
      const forbidden = responseOf('secured', 403);

      expect(unauthorized.schema.properties.code.enum).toEqual([
        'UNAUTHENTICATED',
      ]);
      expect(forbidden.schema.properties.code.enum).toEqual([
        'FORBIDDEN_ROLE',
        'OWNER_ERROR',
        'USER_INACTIVE',
      ]);
      expect(forbidden.description).toContain('titulado, estudiante');
    });

    it('sin roles solo documenta la cuenta inactiva en el 403', () => {
      expect(
        responseOf('authenticated-only', 403).schema.properties.code.enum,
      ).toEqual(['USER_INACTIVE']);
    });
  });
});
