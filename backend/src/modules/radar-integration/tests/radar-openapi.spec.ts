import { Controller, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { documentCommonResponses } from '../../../common/utils/document-common-responses.js';
import { describe, expect, it } from 'vitest';
import { DocumentVerificationController } from '../controllers/document-verification.controller.js';
import { RadarIntegrationController } from '../controllers/radar-integration.controller.js';
import { RadarRecruitmentController } from '../controllers/radar-recruitment.controller.js';

describe('Radar OpenAPI contracts', () => {
  it('publishes unique operation IDs, success schemas, parameters and binary responses for every radar route', async () => {
    const controllers = [
      DocumentVerificationController,
      RadarIntegrationController,
      RadarRecruitmentController,
    ];
    const copies = controllers.map((original) => {
      @Controller()
      class ContractController {}
      for (const key of Reflect.getMetadataKeys(original)) {
        if (!['design:paramtypes', '__guards__'].includes(key))
          Reflect.defineMetadata(
            key,
            Reflect.getMetadata(key, original),
            ContractController,
          );
      }
      for (const method of Object.getOwnPropertyNames(original.prototype)) {
        if (method === 'constructor') continue;
        const originalHandler =
          original.prototype[method as keyof typeof original.prototype];
        const handler = () => undefined;
        for (const key of Reflect.getMetadataKeys(originalHandler)) {
          if (key !== '__guards__')
            Reflect.defineMetadata(
              key,
              Reflect.getMetadata(key, originalHandler),
              handler,
            );
        }
        Object.defineProperty(ContractController.prototype, method, {
          value: handler,
        });
      }
      return ContractController;
    });
    @Module({ controllers: copies })
    class ContractModule {}
    const app = await NestFactory.create(ContractModule, { logger: false });
    try {
      const document = documentCommonResponses(
        SwaggerModule.createDocument(
          app,
          new DocumentBuilder().addBearerAuth().build(),
        ),
      );
      const operations = Object.values(document.paths).flatMap((entry) =>
        Object.entries(entry ?? {})
          .filter(([method]) => ['get', 'post', 'patch'].includes(method))
          .map(([, operation]) => operation),
      );
      expect(operations).toHaveLength(30);
      expect(
        new Set(operations.map((operation) => operation.operationId)).size,
      ).toBe(30);
      for (const operation of operations) {
        expect(operation.summary).toBeTruthy();
        expect(operation.description).toBeTruthy();
        expect(operation.security).toEqual([{ bearer: [] }]);
        expect(operation.responses[401]).toBeDefined();
        expect(operation.responses[500]).toBeDefined();
        for (const code of [400, 401, 403, 404, 409, 500]) {
          const response = operation.responses[code];
          if (response && 'content' in response) {
            expect(response.content?.['application/json']?.schema).toEqual({
              $ref: '#/components/schemas/ApiErrorResponse',
            });
          }
        }
        expect(
          operation.responses[200] ?? operation.responses[201],
        ).toBeDefined();
      }
      const review = document.paths['/radar-document-reviews']!.get!;
      expect(review.parameters).toContainEqual(
        expect.objectContaining({
          name: 'filter',
          in: 'query',
          required: false,
        }),
      );
      const decision = document.paths['/radar-document-reviews/{id}']!.patch!;
      expect(document.components?.schemas?.ApiErrorResponse).toMatchObject({
        required: ['statusCode', 'ok', 'code', 'detail', 'data'],
      });
      expect(decision.parameters).toContainEqual(
        expect.objectContaining({ name: 'id', in: 'path', required: true }),
      );
      expect(decision.requestBody).toBeDefined();
      expect(decision.responses[409]).toBeDefined();
      const preview =
        document.paths['/radar-integration/recruiter/applications/{id}/cv']!
          .get!;
      expect(preview.responses[200]).toMatchObject({
        content: {
          'application/pdf': { schema: { type: 'string', format: 'binary' } },
        },
      });
    } finally {
      await app.close();
    }
  });
});
