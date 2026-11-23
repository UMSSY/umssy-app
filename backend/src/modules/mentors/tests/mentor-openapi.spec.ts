import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { MentorsController } from '../controllers/mentors.controller.js';
import { MentorPhotoController } from '../controllers/mentor-photo.controller.js';
import { MentorExitController } from '../controllers/mentor-exit.controller.js';
import { MentorOffersController } from '../controllers/mentor-offers.controller.js';
import { MentorParticipationController } from '../controllers/mentor-participation.controller.js';
import { MentorCapacityAdminController } from '../controllers/mentor-capacity-admin.controller.js';
import { MentorsService } from '../services/mentors.service.js';
import { MentorPhotoService } from '../services/mentor-photo.service.js';
import { MentorExitService } from '../services/mentor-exit.service.js';
import { MentorOffersService } from '../services/mentor-offers.service.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';
import { MentorCapacityAdminService } from '../services/mentor-capacity-admin.service.js';

describe('Mentor OpenAPI contract', () => {
  let app: INestApplication;
  let document: OpenAPIObject;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        MentorsController,
        MentorPhotoController,
        MentorExitController,
        MentorOffersController,
        MentorParticipationController,
        MentorCapacityAdminController,
      ],
      providers: [
        MentorsService,
        MentorPhotoService,
        MentorExitService,
        MentorOffersService,
        MentorParticipationService,
        MentorCapacityAdminService,
      ].map((provide) => ({ provide, useValue: {} })),
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Mentors')
        .setVersion('1')
        .addBearerAuth()
        .build(),
    );
  });
  afterAll(async () => {
    await app?.close();
  });

  it('documents all operations with unique IDs and concrete success/error schemas', () => {
    const ids: string[] = [];
    for (const path of Object.values(document.paths)) {
      for (const method of ['get', 'post', 'patch', 'put', 'delete'] as const) {
        const operation = path?.[method];
        if (!operation) continue;
        expect(operation.operationId).toBeTruthy();
        ids.push(operation.operationId!);
        expect(operation.tags?.length).toBeGreaterThan(0);
        expect(operation.summary!.length).toBeLessThan(65);
        expect(operation.description).toBeTruthy();
        for (const response of Object.values(operation.responses)) {
          expect(response).toHaveProperty('content');
          if ('content' in response) {
            for (const media of Object.values(response.content ?? {}))
              expect(media.schema).toBeDefined();
          }
        }
        expect(operation.responses['500']).toBeDefined();
      }
    }
    expect(ids).toHaveLength(24);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps public reads anonymous and protected operations bearer-authenticated', () => {
    const publicPaths = [
      '/mentors',
      '/mentors/{userId}',
      '/mentors/{userId}/similar',
      '/mentors/{userId}/photo',
    ];
    for (const [url, path] of Object.entries(document.paths)) {
      for (const method of ['get', 'post', 'patch', 'put', 'delete'] as const) {
        const operation = path?.[method];
        if (!operation) continue;
        if (publicPaths.includes(url)) {
          expect(operation.security ?? []).toEqual([]);
          expect(operation.responses['403']).toBeUndefined();
        } else expect(operation.security).toEqual([{ bearer: [] }]);
      }
    }
  });

  it('preserves binary photos, legacy history, idempotency and Zod constraints', () => {
    const photo = document.paths['/mentors/{userId}/photo']!.get!;
    expect(photo.responses['200']).toMatchObject({
      content: {
        'image/png': { schema: { type: 'string', format: 'binary' } },
        'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      },
      headers: { 'Cache-Control': { schema: { enum: ['no-store'] } } },
    });
    const history =
      document.paths['/mentor-participation/requests/me/history']!.get!;
    expect(history.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: {
            properties: {
              data: {
                oneOf: [
                  expect.objectContaining({ type: 'array' }),
                  expect.objectContaining({ type: 'object' }),
                ],
              },
            },
          },
        },
      },
    });
    for (const url of ['/mentors/activate', '/mentor-participation/requests']) {
      const operation = document.paths[url]!.post!;
      expect(operation.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            in: 'header',
            name: 'Idempotency-Key',
            required: true,
          }),
        ]),
      );
      expect(operation.requestBody).toMatchObject({
        content: {
          'application/json': {
            schema: {
              required: ['technicalAreaIds', 'orientationTypeIds'],
              properties: {
                technicalAreaIds: { minItems: 1, items: { format: 'uuid' } },
              },
            },
          },
        },
      });
      expect(operation.responses['201']).toBeDefined();
      expect(operation.responses['429']).toHaveProperty('headers.Retry-After');
    }
  });
});
