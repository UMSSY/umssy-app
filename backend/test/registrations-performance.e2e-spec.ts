import type { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { EventRegistrationsController } from '../src/modules/event-registrations/controllers/event-registrations.controller.js';
import { EventRegistrationsRepository } from '../src/modules/event-registrations/repositories/event-registrations.repository.js';
import { EventRegistrationsService } from '../src/modules/event-registrations/services/event-registrations.service.js';
import { EventsRepository } from '../src/modules/events/repositories/events.repository.js';
import { EventsService } from '../src/modules/events/services/events.service.js';

const id = (n: number) =>
  `13000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const userId = id(0);
const activeIds = Array.from({ length: 5 }, (_, n) => id(n + 1));
const finishedIds = Array.from({ length: 50 }, (_, n) => id(n + 6));
const cancelledIds = Array.from({ length: 5 }, (_, n) => id(n + 56));

// Optativo: nunca utiliza la base habitual ni forma parte de las pruebas unitarias.
describe.skipIf(process.env.HU13_BASELINE !== '1')(
  'HU13 PostgreSQL baseline',
  () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let rows = 0;
    let queries = 0;

    beforeAll(async () => {
      if (!process.env.DB_NAME?.startsWith('umssy_hu13_')) {
        throw new Error('Se requiere una base temporal umssy_hu13_*.');
      }
      prisma = new PrismaService();
      await prisma.$connect();
      // Evita sobrescribir un conjunto de datos de una ejecución anterior.
      expect(await prisma.user.count()).toBe(0);
      await prisma.user.create({
        data: {
          id: userId,
          firstName: 'HU13',
          lastName: 'QA',
          email: 'hu13@example.test',
        },
      });
      const category = await prisma.eventCategory.upsert({
        where: { name: 'HU13' },
        update: {},
        create: { name: 'HU13' },
      });
      const modality = await prisma.eventModality.upsert({
        where: { title: 'Presencial' },
        update: {},
        create: { title: 'Presencial' },
      });
      const origin = await prisma.eventOrigin.upsert({
        where: { title: 'Institucional' },
        update: {},
        create: { title: 'Institucional' },
      });
      const status = await prisma.eventStatus.upsert({
        where: { title: 'Publicado' },
        update: {},
        create: { title: 'Publicado' },
      });
      const confirmed = await prisma.registrationStatus.upsert({
        where: { title: 'Confirmada' },
        update: {},
        create: { title: 'Confirmada' },
      });
      const cancelled = await prisma.registrationStatus.upsert({
        where: { title: 'Cancelada' },
        update: {},
        create: { title: 'Cancelada' },
      });
      for (let n = 1; n <= 60; n++) {
        await prisma.event.create({
          data: {
            id: id(100 + n),
            title: `HU13 Taller ${n}`,
            createdById: userId,
            categoryId: category.id,
            modalityId: modality.id,
            originId: origin.id,
            statusId: status.id,
            eventDate: new Date(Date.UTC(n <= 5 ? 2099 : 2020, 0, n)),
            startTime: new Date('1970-01-01T09:00:00Z'),
            endTime: new Date('1970-01-01T12:00:00Z'),
            location: 'Aula HU13',
            capacity: 40,
            registrations: {
              create: {
                id: id(n),
                userId,
                statusId: n > 55 ? cancelled.id : confirmed.id,
                qrToken: randomBytes(32).toString('hex'),
                registeredAt: new Date('2019-01-01T00:00:00Z'),
                cancelledAt: n > 55 ? new Date('2019-01-02T00:00:00Z') : null,
              },
            },
          },
        });
      }
      const measured = prisma.$extends({
        query: {
          eventRegistration: {
            async findMany({ args, query }) {
              const result = await query(args);
              queries++;
              rows += result.length;
              return result;
            },
          },
        },
      });
      const service = new EventRegistrationsService(
        new EventRegistrationsRepository(measured as unknown as PrismaService),
        new EventsService(new EventsRepository(prisma)),
      );
      const module = await Test.createTestingModule({
        controllers: [EventRegistrationsController],
        providers: [{ provide: EventRegistrationsService, useValue: service }],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({
          canActivate(context: ExecutionContext) {
            context.switchToHttp().getRequest().user = {
              id: userId,
              roles: ['titulado'],
            };
            return true;
          },
        })
        .compile();
      app = module.createNestApplication();
      app.setGlobalPrefix('api');
      app.useGlobalInterceptors(new ResponseInterceptor());
      await app.init();
    }, 30_000);

    afterAll(async () => {
      await app?.close();
      await prisma?.$disconnect();
    });

    it('records latency, bytes, materialized rows and exact baseline IDs', async () => {
      expect(await prisma.eventRegistration.count()).toBe(60);
      expect(
        await prisma.eventRegistration.count({
          where: { cancelledAt: { not: null } },
        }),
      ).toBe(5);
      const samples = [];
      for (const [scope, suffix, expected] of [
        ['list', '', [...finishedIds, ...activeIds]],
        [
          'history',
          '?scope=finished&page=1&limit=10',
          [...finishedIds].reverse().slice(0, 10),
        ],
      ] as const) {
        const timings: number[] = [];
        let bytes = 0;
        rows = 0;
        queries = 0;
        for (let n = 0; n < 23; n++) {
          if (n === 3) {
            rows = 0;
            queries = 0;
          }
          const start = performance.now();
          const response = await request(app.getHttpServer())
            .get(`/api/event-registrations/me${suffix}`)
            .expect(200);
          const elapsed = performance.now() - start;
          const items =
            scope === 'list' ? response.body.data : response.body.data.items;
          expect(items.map((item: { id: string }) => item.id)).toEqual(
            expected,
          );
          expect(response.headers['cache-control']).toBe('private, no-store');
          if (scope === 'history') expect(response.body.data.total).toBe(50);
          if (n >= 3) {
            timings.push(elapsed);
            bytes = Buffer.byteLength(response.text);
          }
        }
        timings.sort((a, b) => a - b);
        samples.push({
          scope,
          requests: timings.length,
          timingsMs: timings,
          p50Ms: timings[9],
          p95Ms: timings[18],
          bytes,
          returned: expected.length,
          materializedRowsPerRequest: rows / 20,
          registrationFindManyPerRequest: queries / 20,
        });
      }
      const report = {
        node: process.version,
        database: await prisma.$queryRaw`SELECT version()`,
        dataset: { activeIds, finishedIds, cancelledIds },
        samples,
      };
      console.log(JSON.stringify(report, null, 2));
      if (process.env.HU13_REPORT_PATH)
        writeFileSync(
          process.env.HU13_REPORT_PATH,
          JSON.stringify(report, null, 2) + '\n',
        );
    }, 30_000);
  },
);
