import type { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter.js';
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
              id:
                context.switchToHttp().getRequest().headers.authorization ===
                'Bearer hu13-other'
                  ? id(999)
                  : userId,
              roles: ['titulado'],
            };
            return true;
          },
        })
        .compile();
      app = module.createNestApplication();
      app.setGlobalPrefix('api');
      app.useGlobalInterceptors(new ResponseInterceptor());
      app.useGlobalFilters(new DomainExceptionFilter());
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
        ['list', '', activeIds],
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
    it('preserves every history page and excludes passes exactly at their Bolivia end time', async () => {
      const historyIds: string[] = [];
      for (let page = 1; page <= 5; page++) {
        const response = await request(app.getHttpServer())
          .get(
            `/api/event-registrations/me?scope=finished&page=${page}&limit=10`,
          )
          .expect(200);
        historyIds.push(
          ...response.body.data.items.map((item: { id: string }) => item.id),
        );
      }
      expect(historyIds).toEqual([...finishedIds].reverse());
      const eventId = id(105);
      const previous = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
      });
      vi.useFakeTimers({ toFake: ['Date'] });
      try {
        await prisma.event.update({
          where: { id: eventId },
          data: { eventDate: new Date('2026-10-23T00:00:00Z') },
        });
        for (const [now, expected] of [
          ['2026-10-23T15:59:59Z', [id(5), ...activeIds.slice(0, 4)]],
          ['2026-10-23T16:00:00Z', activeIds.slice(0, 4)],
        ] as const) {
          vi.setSystemTime(new Date(now));
          const response = await request(app.getHttpServer())
            .get('/api/event-registrations/me')
            .expect(200);
          expect(
            response.body.data.map((item: { id: string }) => item.id),
          ).toEqual(expected);
        }
        const history = await request(app.getHttpServer())
          .get('/api/event-registrations/me?scope=finished')
          .expect(200);
        expect(history.body.data.total).toBe(51);
        expect(history.body.data.items[0].id).toBe(id(5));
      } finally {
        vi.useRealTimers();
        await prisma.event.update({
          where: { id: eventId },
          data: { eventDate: previous.eventDate },
        });
      }
    });
    it('keeps QR tokens stable, isolates users and removes a cancelled pass from both lists', async () => {
      const otherUserId = id(999);
      await prisma.user.create({
        data: {
          id: otherUserId,
          firstName: 'Otro',
          lastName: 'QA',
          email: 'hu13-other@example.test',
        },
      });
      await prisma.eventRegistration.create({
        data: {
          id: id(998),
          user: { connect: { id: otherUserId } },
          event: { connect: { id: id(101) } },
          status: { connect: { title: 'Confirmada' } },
          qrToken: randomBytes(32).toString('hex'),
        },
      });
      const first = await request(app.getHttpServer())
        .get(`/api/event-registrations/${id(1)}/pass`)
        .expect(200);
      const second = await request(app.getHttpServer())
        .get(`/api/event-registrations/${id(1)}/pass`)
        .expect(200);
      expect(first.body.data.qrToken).toMatch(/^[a-f0-9]{64}$/);
      expect(second.body.data.qrToken).toBe(first.body.data.qrToken);
      const own = await request(app.getHttpServer())
        .get(`/api/event-registrations/me?userId=${otherUserId}`)
        .expect(200);
      expect(own.body.data.map((item: { id: string }) => item.id)).toEqual(
        activeIds,
      );
      expect(JSON.stringify(own.body)).not.toContain('qrToken');
      const other = await request(app.getHttpServer())
        .get('/api/event-registrations/me')
        .set('Authorization', 'Bearer hu13-other')
        .expect(200);
      expect(other.body.data.map((item: { id: string }) => item.id)).toEqual([
        id(998),
      ]);
      await request(app.getHttpServer())
        .get(`/api/event-registrations/${id(1)}/pass`)
        .set('Authorization', 'Bearer hu13-other')
        .expect(404);
      await request(app.getHttpServer())
        .delete(`/api/event-registrations/${id(5)}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/event-registrations/${id(5)}/pass`)
        .expect(404);
      const current = await request(app.getHttpServer())
        .get('/api/event-registrations/me')
        .expect(200);
      expect(current.body.data.map((item: { id: string }) => item.id)).toEqual(
        activeIds.slice(0, 4),
      );
      const history = await request(app.getHttpServer())
        .get('/api/event-registrations/me?scope=finished')
        .expect(200);
      expect(history.body.data.total).toBe(50);
      expect(
        history.body.data.items.map((item: { id: string }) => item.id),
      ).not.toContain(id(5));
    });
  },
);
