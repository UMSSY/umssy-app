import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../prisma/client.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { SessionService } from '../../../common/services/session.service.js';
import { SessionRepository } from '../../../common/repositories/session.repository.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { MentorParticipationController } from '../controllers/mentor-participation.controller.js';
import { MentorsController } from '../controllers/mentors.controller.js';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';
import { MentorsService } from '../services/mentors.service.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import { MentorAffinityService } from '../services/mentor-affinity.service.js';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';
import { MentorOffersService } from '../services/mentor-offers.service.js';

const connectionString = process.env.HU7_TEST_DATABASE_URL;
const migration = '20261028010000_mentor_intake_compatibility';
const directory = new URL('../../../../prisma/migrations/', import.meta.url);

// Real JWT/session/HTTP/Prisma/PostgreSQL. No mocked guard or persistence.
describe.skipIf(!connectionString).each(['develop', 'reverted-catalogs'])(
  'HU6-HU7 HTTP/PostgreSQL: %s',
  (variant) => {
    const schema = `hu6_hu7_regression_${randomBytes(6).toString('hex')}`;
    let admin: pg.Client;
    let prisma: PrismaClient;
    let app: INestApplication;
    let server: Server;
    let created = false;
    let mentorRole: string;
    let graduateRole: string;
    let area: string;
    let orientation: string;
    const users = Array.from({ length: 25 }, () => randomUUID());
    const tokens: string[] = [];
    const preferences = () => ({
      technicalAreaIds: [area],
      orientationTypeIds: [orientation],
    });
    const get = (index: number) =>
      request(server)
        .get('/api/mentor-participation/requests/me')
        .auth(tokens[index], { type: 'bearer' });
    const submit = (
      index: number,
      key = randomUUID(),
      path = '/api/mentor-participation/requests',
      body = preferences(),
    ) =>
      request(server)
        .post(path)
        .auth(tokens[index], { type: 'bearer' })
        .set('Idempotency-Key', key)
        .send(body);

    beforeAll(async () => {
      const url = new URL(connectionString!);
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
        !url.pathname.includes('hu6_hu7_regression')
      ) {
        throw new Error('Use an exclusive local hu6_hu7_regression database');
      }
      admin = new pg.Client({ connectionString });
      await admin.connect();
      await admin.query(`CREATE SCHEMA "${schema}"`);
      created = true;
      await admin.query(`SET search_path TO "${schema}", public`);
      for (const name of (await readdir(directory))
        .filter((name) => /^\d/.test(name) && name < migration)
        .sort()) {
        await admin.query(
          await readFile(new URL(`${name}/migration.sql`, directory), 'utf8'),
        );
      }
      prisma = new PrismaClient({
        adapter: new PrismaPg(
          {
            connectionString,
            options: `-c search_path=${schema} -c TimeZone=UTC`,
          },
          { schema },
        ),
      });
      const db = prisma as unknown as PrismaService;
      graduateRole = (await prisma.role.create({ data: { name: 'titulado' } }))
        .id;
      mentorRole = (await prisma.role.create({ data: { name: 'mentor' } })).id;
      area = (
        await prisma.technicalArea.create({ data: { name: 'Regression' } })
      ).id;
      orientation = (
        await prisma.orientationType.create({ data: { name: 'Regression' } })
      ).id;
      const career = await prisma.career.create({
        data: { title: 'Regression' },
      });
      const approved = await prisma.accessRequestStatus.create({
        data: { title: 'approved' },
      });
      for (const [index, id] of users.entries()) {
        await prisma.user.create({
          data: {
            id,
            firstName: 'QA',
            lastName: String(index),
            email: `qa${index}@example.test`,
          },
        });
        await prisma.userRole.create({
          data: { userId: id, roleId: graduateRole },
        });
        await prisma.accessRequest.create({
          data: {
            firstName: 'QA',
            lastName: String(index),
            email: `qa${index}@example.test`,
            idCardNumber: `9000${index}`,
            sisCode: `9000${index}`,
            idCardIssuedIn: 'CB',
            birthDate: new Date('1990-01-01'),
            graduationYear: 2025,
            careerId: career.id,
            statusId: approved.id,
            approvedUserId: id,
          },
        });
      }
      const jwt = new JwtService({
        secret: randomBytes(32).toString('hex'),
        signOptions: { expiresIn: '1h' },
      });
      for (const id of users)
        tokens.push(
          await jwt.signAsync({
            sub: id,
            roleTag: 'titulado',
            roles: ['titulado'],
          }),
        );
      const participation = new MentorParticipationService(
        new MentorParticipationRepository(db),
      );
      const mentorsRepository = new MentorsRepository(db);
      const mentors = new MentorsService(
        mentorsRepository,
        new MentorMapper(),
        new MentorAffinityService(mentorsRepository),
      );
      const session = new SessionService(new SessionRepository(db));
      const module = await Test.createTestingModule({
        controllers: [MentorParticipationController, MentorsController],
        providers: [
          { provide: MentorParticipationService, useValue: participation },
          { provide: MentorsService, useValue: mentors },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(new JwtAuthGuard(jwt, session))
        .compile();
      app = module.createNestApplication();
      app.setGlobalPrefix('api');
      app.useGlobalFilters(new DomainExceptionFilter());
      await app.init();
      server = app.getHttpServer<Server>();
      const sentinel = await prisma.mentorParticipationRequest.create({
        data: { userId: users[5], status: 'OFFERED', ...preferences() },
      });
      const sentinelOffer = await prisma.mentorSlotOffer.create({
        data: {
          userId: users[5],
          requestId: sentinel.id,
          expiresAt: new Date(Date.now() + 86_400_000),
        },
      });
      await prisma.mentorParticipationAttemptLimit.create({
        data: {
          userId: users[5],
          attemptCount: 5,
          windowStartedAt: new Date(),
          blockedUntil: new Date(Date.now() + 72 * 3_600_000),
        },
      });
      if (variant === 'reverted-catalogs') {
        for (const name of [
          '20261027030000_mentor_intake_idempotency_outbox',
          '20261027180000_mentor_participation_catalogs',
        ]) {
          await admin.query(
            await readFile(
              new URL(`./fixtures/${name}.sql`, import.meta.url),
              'utf8',
            ),
          );
        }
        // Exact failure produced by develop's reconciliation, even for a user without requests.
        await expect(participation.findMyRequest(users[0])).rejects.toSatisfy(
          (error: unknown) => JSON.stringify(error).includes('42703'),
        );
        await get(0).expect(500);
      }
      await admin.query(
        await readFile(
          new URL(`${migration}/migration.sql`, directory),
          'utf8',
        ),
      );
      expect(
        await prisma.mentorParticipationRequest.findUnique({
          where: { id: sentinel.id },
        }),
      ).toEqual(sentinel);
      expect(
        await prisma.mentorSlotOffer.findUnique({
          where: { id: sentinelOffer.id },
        }),
      ).toEqual(sentinelOffer);
      expect(await prisma.mentorParticipationSanction.count()).toBe(1);
      expect(await prisma.mentorIntakeAttempt.count()).toBe(5);
      expect(await prisma.mentorMailOutbox.count()).toBe(2);
    }, 60_000);

    afterAll(async () => {
      await app?.close();
      await prisma?.$disconnect();
      if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      await admin?.end();
    });

    beforeEach(async () => {
      await prisma.$executeRaw`TRUNCATE mentor_mail_outbox, mentor_participation_sanctions, mentor_intake_attempts, mentor_slot_offers, mentor_participation_requests`;
      await prisma.mentorParticipationAttemptLimit.deleteMany();
      await prisma.userRole.deleteMany({ where: { roleId: mentorRole } });
      await prisma.mentorTechnicalArea.deleteMany();
      await prisma.mentorOrientationType.deleteMany();
      await prisma.user.updateMany({
        data: { isAvailableForMentoring: false, isActive: false },
      });
      await prisma.user.updateMany({
        where: { id: { in: users.slice(0, 10) } },
        data: { isActive: true },
      });
      await prisma.userRole.createMany({
        data: users
          .slice(0, 4)
          .map((userId) => ({ userId, roleId: mentorRole })),
      });
    });

    it('requires a real JWT and UUID key, rejects forged identity', async () => {
      await request(server)
        .get('/api/mentor-participation/requests/me')
        .expect(401);
      await request(server)
        .post('/api/mentor-participation/requests')
        .auth(tokens[4], { type: 'bearer' })
        .send(preferences())
        .expect(400);
      await submit(4, 'invalid').expect(400);
      await submit(4, randomUUID(), undefined, {
        ...preferences(),
        userId: users[0],
      } as ReturnType<typeof preferences>).expect(400);
      expect(await prisma.mentorIntakeAttempt.count()).toBe(0);
    });

    it.each([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 1],
      [5, 2],
      [9, 3],
      [10, 4],
      [25, 10],
    ])(
      'PostgreSQL counts %i active approved linked graduates with capacity %i',
      async (graduates, capacity) => {
        await prisma.userRole.deleteMany({ where: { roleId: mentorRole } });
        await prisma.user.updateMany({ data: { isActive: false } });
        await prisma.user.updateMany({
          where: { id: { in: users.slice(0, graduates) } },
          data: { isActive: true },
        });
        expect(
          await new MentorsRepository(
            prisma as unknown as PrismaService,
          ).capacity(),
        ).toMatchObject({ capacity, occupied: 0, available: capacity });
      },
    );

    it('a matching approved email without the linked account is not eligible', async () => {
      const approved = await prisma.accessRequest.findFirstOrThrow({
        where: { approvedUserId: users[4] },
      });
      await prisma.accessRequest.update({
        where: { id: approved.id },
        data: { approvedUserId: null },
      });
      try {
        await submit(4).expect(403);
        await submit(4, randomUUID(), '/api/mentors/activate').expect(403);
        expect(await prisma.mentorParticipationRequest.count()).toBe(0);
      } finally {
        await prisma.accessRequest.update({
          where: { id: approved.id },
          data: { approvedUserId: users[4] },
        });
      }
    });

    it.each([
      'NONE',
      'PENDING',
      'OFFERED',
      'CANCELLED',
      'EXPIRED',
      'ENDED',
      'ACTIVE',
    ])(
      'GET returns correct isolated state for %s, including simultaneous readers',
      async (status) => {
        const user = status === 'ACTIVE' ? 0 : 4;
        if (status !== 'NONE') {
          const record = await prisma.mentorParticipationRequest.create({
            data: { userId: users[user], status, ...preferences() },
          });
          if (status === 'OFFERED')
            await prisma.mentorSlotOffer.create({
              data: {
                userId: users[user],
                requestId: record.id,
                expiresAt: new Date(Date.now() + 86_400_000),
              },
            });
        }
        const responses = await Promise.all([get(user), get(user), get(8)]);
        expect(responses.map((response) => response.status)).toEqual([
          200, 200, 200,
        ]);
        expect(responses[0].body.data?.status ?? 'NONE').toBe(status);
        expect(responses[2].body.data).toBeNull();
        expect(await prisma.mentorIntakeAttempt.count()).toBe(0);
      },
    );

    it('active mentor with no old request and active mentor with closed history both load', async () => {
      expect((await get(0).expect(200)).body.data).toBeNull();
      await prisma.mentorParticipationRequest.create({
        data: { userId: users[0], status: 'CANCELLED', ...preferences() },
      });
      expect((await get(0).expect(200)).body.data).toBeNull();
      const result = await request(server)
        .get('/api/mentors/me/participation')
        .auth(tokens[0], { type: 'bearer' })
        .expect(200);
      expect(result.body.data.status).toBe('ACTIVE');
    });

    it('replays a successful request concurrently and after service recreation without changing its FIFO position', async () => {
      const key = randomUUID();
      const results = await Promise.all([submit(4, key), submit(4, key)]);
      expect(results.map((result) => result.status)).toEqual([201, 201]);
      expect(results[0].body).toEqual(results[1].body);
      expect(await prisma.mentorParticipationRequest.count()).toBe(1);
      expect(await prisma.mentorIntakeAttempt.count()).toBe(1);
      const fresh = new MentorParticipationService(
        new MentorParticipationRepository(prisma as unknown as PrismaService),
      );
      expect(
        JSON.parse(
          JSON.stringify(await fresh.create(users[4], preferences(), key)),
        ),
      ).toEqual(results[0].body.data);
      await submit(4, key, undefined, {
        ...preferences(),
        technicalAreaIds: [randomUUID()],
      }).expect(409);
      expect(await prisma.mentorIntakeAttempt.count()).toBe(1);
    });

    it('replays direct activation once without duplicating mentor role, preferences or capacity', async () => {
      await prisma.userRole.deleteMany({
        where: { roleId: mentorRole, userId: users[3] },
      });
      const key = randomUUID();
      const responses = await Promise.all([
        submit(4, key, '/api/mentors/activate'),
        submit(4, key, '/api/mentors/activate'),
      ]);
      expect(responses.map((response) => response.status)).toEqual([201, 201]);
      expect(responses[0].body).toEqual(responses[1].body);
      expect(
        await prisma.userRole.count({
          where: { userId: users[4], roleId: mentorRole, deletedAt: null },
        }),
      ).toBe(1);
      expect(
        await prisma.mentorTechnicalArea.count({
          where: { mentorId: users[4] },
        }),
      ).toBe(1);
      expect(
        await prisma.mentorOrientationType.count({
          where: { mentorId: users[4] },
        }),
      ).toBe(1);
      expect(await prisma.mentorIntakeAttempt.count()).toBe(1);
      const response = await request(server)
        .get('/api/mentors/capacity')
        .auth(tokens[4], { type: 'bearer' })
        .expect(200);
      expect(response.body.data).toMatchObject({
        capacity: 4,
        occupied: 4,
        available: 0,
      });
    });

    it('two independent backend pools allocate only one reservation and one event for the same slot', async () => {
      await prisma.userRole.deleteMany({
        where: { roleId: mentorRole, userId: users[3] },
      });
      for (const userId of users.slice(4, 7))
        await prisma.mentorParticipationRequest.create({
          data: { userId, ...preferences() },
        });
      const otherPool = new PrismaClient({
        adapter: new PrismaPg(
          {
            connectionString,
            options: `-c search_path=${schema} -c TimeZone=UTC`,
          },
          { schema },
        ),
      });
      try {
        const instances = [prisma, otherPool].map(
          (pool) =>
            new MentorOffersService(
              new MentorOffersRepository(pool as unknown as PrismaService),
            ),
        );
        await Promise.all(instances.map((instance) => instance.reconcile()));
        expect(
          await prisma.mentorSlotOffer.count({ where: { status: 'OFFERED' } }),
        ).toBe(1);
        expect(
          await prisma.mentorParticipationRequest.count({
            where: { status: 'PENDING' },
          }),
        ).toBe(2);
        expect(
          await prisma.mentorMailOutbox.count({ where: { kind: 'OFFER' } }),
        ).toBe(1);
      } finally {
        await otherPool.$disconnect();
      }
    });

    it('sanction leaves the existing request and reserved offer intact', async () => {
      const pending = await submit(4).expect(201);
      for (let i = 0; i < 3; i++) await submit(4).expect(409);
      await prisma.userRole.deleteMany({
        where: { roleId: mentorRole, userId: users[3] },
      });
      const offered = (await get(4).expect(200)).body.data;
      expect(offered.status).toBe('OFFERED');
      await submit(4).expect(429);
      expect((await get(4).expect(200)).body.data).toEqual(offered);
      expect(
        await prisma.mentorSlotOffer.count({
          where: { requestId: pending.body.data.id, status: 'OFFERED' },
        }),
      ).toBe(1);
    });

    it('counts both POST routes, serializes fourth/fifth attempts and preserves one exact 72h sanction/event', async () => {
      for (let i = 0; i < 3; i++) {
        const path =
          i % 2
            ? '/api/mentors/activate'
            : '/api/mentor-participation/requests';
        await submit(0, randomUUID(), path).expect(403 + (i % 2 ? 6 : 0));
      }
      const keys = [randomUUID(), randomUUID()];
      const results = await Promise.all(keys.map((key) => submit(0, key)));
      expect(
        results
          .map((response) => response.status)
          .sort((left, right) => left - right),
      ).toEqual([403, 429]);
      const blocked = results.find((response) => response.status === 429)!;
      expect(blocked.body.code).toBe('MENTOR_REQUEST_SUSPENDED');
      expect(Number(blocked.headers['retry-after'])).toBeGreaterThanOrEqual(
        259199,
      );
      const sanction =
        await prisma.mentorParticipationSanction.findFirstOrThrow();
      expect(sanction.endsAt.getTime() - sanction.startedAt.getTime()).toBe(
        72 * 3_600_000,
      );
      await submit(0).expect(429);
      expect(await prisma.mentorParticipationSanction.count()).toBe(1);
      expect(
        (await prisma.mentorParticipationSanction.findFirstOrThrow()).endsAt,
      ).toEqual(sanction.endsAt);
      expect(
        await prisma.mentorMailOutbox.count({ where: { kind: 'SANCTION' } }),
      ).toBe(1);
      expect(
        await prisma.mentorIntakeAttempt.count({ where: { counted: true } }),
      ).toBe(5);
    });

    it('uses a rolling 24h cutoff and does not count GET/edit/cancel', async () => {
      const first = await submit(4).expect(201);
      await prisma.$executeRaw`UPDATE mentor_intake_attempts SET occurred_at = clock_timestamp() - interval '24 hours'`;
      for (let i = 0; i < 3; i++) await submit(4).expect(409);
      await get(4).expect(200);
      await request(server)
        .patch('/api/mentor-participation/requests/me')
        .auth(tokens[4], { type: 'bearer' })
        .send(preferences())
        .expect(200);
      await request(server)
        .delete('/api/mentor-participation/requests/me')
        .auth(tokens[4], { type: 'bearer' })
        .expect(200);
      await submit(4).expect(201); // Four recent distinct attempts, no suspension.
      expect(await prisma.mentorParticipationSanction.count()).toBe(0);
      expect(
        await prisma.mentorParticipationRequest.findUnique({
          where: { id: first.body.data.id },
        }),
      ).toMatchObject({ status: 'CANCELLED' });
    });

    it('technical database faults roll back the attempt and do not fabricate a successful GET', async () => {
      await admin.query(
        `CREATE FUNCTION hu7_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'controlled failure'; END $$`,
      );
      await admin.query(
        `CREATE TRIGGER hu7_fail BEFORE INSERT ON mentor_participation_requests FOR EACH ROW EXECUTE FUNCTION hu7_fail()`,
      );
      try {
        await submit(4).expect(500);
        expect(await prisma.mentorIntakeAttempt.count()).toBe(0);
        expect(await prisma.mentorParticipationRequest.count()).toBe(0);
      } finally {
        await admin.query(
          'DROP TRIGGER hu7_fail ON mentor_participation_requests',
        );
      }
    });

    it('expires and reallocates while GET runs, preserving timestamps and recording one event', async () => {
      await prisma.userRole.deleteMany({
        where: { roleId: mentorRole, userId: users[3] },
      });
      const previous = await prisma.mentorParticipationRequest.create({
        data: { userId: users[4], status: 'OFFERED', ...preferences() },
      });
      await prisma.mentorSlotOffer.create({
        data: {
          userId: users[4],
          requestId: previous.id,
          offeredAt: new Date(Date.now() - 86_400_001),
          expiresAt: new Date(Date.now() - 1),
        },
      });
      const next = await prisma.mentorParticipationRequest.create({
        data: { userId: users[5], ...preferences() },
      });
      await Promise.all([get(4).expect(200), get(5).expect(200)]);
      const offer = await prisma.mentorSlotOffer.findUniqueOrThrow({
        where: { requestId: next.id },
      });
      expect(offer.expiresAt.getTime() - offer.offeredAt.getTime()).toBe(
        86_400_000,
      );
      expect(
        await prisma.mentorParticipationRequest.findUnique({
          where: { id: previous.id },
        }),
      ).toMatchObject({ status: 'EXPIRED' });
      expect(
        await prisma.mentorMailOutbox.count({
          where: { eventKey: `offer:${offer.id}` },
        }),
      ).toBe(1);
      const saved = await prisma.mentorParticipationRequest.findUniqueOrThrow({
        where: { id: next.id },
      });
      const nonUtc = new PrismaClient({
        adapter: new PrismaPg(
          {
            connectionString,
            options: `-c search_path=${schema} -c TimeZone=America/La_Paz`,
          },
          { schema },
        ),
      });
      try {
        const history = await new MentorParticipationRepository(
          nonUtc as unknown as PrismaService,
        ).findMyHistory(users[5]);
        expect(history[0].queuedAt).toEqual(saved.queuedAt);
      } finally {
        await nonUtc.$disconnect();
      }
      if (variant === 'reverted-catalogs') {
        const result = await admin.query(
          'SELECT mentor_request_status_title(status_id) AS status FROM mentor_participation_requests WHERE id=$1',
          [next.id],
        );
        expect(result.rows[0].status).toBe('OFFERED');
      }
    });
  },
);
