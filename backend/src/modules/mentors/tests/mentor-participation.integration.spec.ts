
import { randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../prisma/client.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';

const connectionString = process.env.HU7_TEST_DATABASE_URL;
const schema = `hu7_participation_test_${randomBytes(6).toString('hex')}`;

const uuid = (kind: string, number: number) =>
  `14390000-0000-4000-${kind}-${String(number).padStart(12, '0')}`;

describe.skipIf(!connectionString)(
  'HU7-2 y HU7-4: participacion en PostgreSQL',
  () => {
    let admin: pg.Client;
    let prisma: PrismaClient;
    let service: MentorParticipationService;

    let areaId: string;
    let orientationId: string;
    let created = false;

    const userId = (number: number) => uuid('8000', number);

    beforeAll(async () => {
      const url = new URL(connectionString!);

      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      ) {
        throw new Error('Solo se permite PostgreSQL local');
      }

      admin = new pg.Client({ connectionString });
      await admin.connect();

      await admin.query(`CREATE SCHEMA "${schema}"`);
      created = true;

      await admin.query(`SET search_path TO "${schema}", public`);

      const migrations = new URL(
        '../../../../prisma/migrations/',
        import.meta.url,
      );

      const names = (await readdir(migrations))
        .filter((name) => /^\d/.test(name))
        .sort();

      for (const name of names) {
        const sql = await readFile(
          new URL(`${name}/migration.sql`, migrations),
          'utf8',
        );

        await admin.query(sql);
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

      const repository = new MentorParticipationRepository(
        prisma as unknown as PrismaService,
      );

      service = new MentorParticipationService(repository);

      await prisma.$transaction(async (tx) => {
        const graduateRole = await tx.role.create({
          data: { name: 'titulado' },
        });

        const approvedStatus = await tx.accessRequestStatus.create({
          data: { title: 'approved' },
        });

        const career = await tx.career.create({
          data: { title: 'HU7 participation test' },
        });

        areaId = (
          await tx.technicalArea.create({
            data: { name: 'HU7 participation area' },
          })
        ).id;

        orientationId = (
          await tx.orientationType.create({
            data: { name: 'HU7 participation orientation' },
          })
        ).id;

        for (let number = 1; number <= 5; number += 1) {
          const id = userId(number);
          const requestId = uuid('9000', number);
          const email = `participation.${number}@example.test`;

          await tx.user.create({
            data: {
              id,
              firstName: 'HU7',
              lastName: String(number),
              email,
            },
          });

          await tx.userRole.create({
            data: {
              userId: id,
              roleId: graduateRole.id,
            },
          });

          await tx.accessRequest.create({
            data: {
              id: requestId,
              firstName: 'HU7',
              lastName: String(number),
              email,
              idCardNumber: `1439000${number}`,
              sisCode: `14390000${number}`,
              idCardIssuedIn: 'CB',
              birthDate: new Date('1990-01-01'),
              graduationYear: 2025,
              careerId: career.id,
              statusId: approvedStatus.id,
            },
          });

          await tx.$executeRaw`
            UPDATE access_requests
            SET approved_user_id = ${id}::uuid
            WHERE id = ${requestId}::uuid
          `;
        }

        const mentorRole = await tx.role.create({
          data: { name: 'mentor' },
        });

        for (let number = 4; number <= 5; number += 1) {
          await tx.userRole.create({
            data: {
              userId: userId(number),
              roleId: mentorRole.id,
            },
          });
        }
      });
    }, 30_000);

    afterAll(async () => {
      await prisma?.$disconnect();

      if (created) {
        await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      }

      await admin?.end();
    });

    beforeEach(async () => {
      await prisma.mentorParticipationAttemptLimit.deleteMany();
      await prisma.mentorParticipationRequest.deleteMany();
    });

    const preferences = () => ({
      technicalAreaIds: [areaId],
      orientationTypeIds: [orientationId],
    });

    describe('HU7-2: solicitudes FIFO', () => {
      it('crea una solicitud pendiente cuando no hay cupos', async () => {
        const result = await service.create(
          userId(1),
          preferences(),
        );

        expect(result.status).toBe('PENDING');

        const saved =
          await prisma.mentorParticipationRequest.findMany({
            where: { userId: userId(1) },
          });

        expect(saved).toHaveLength(1);
        expect(saved[0].id).toBe(result.id);
      });

      it('evita solicitudes duplicadas bajo concurrencia', async () => {
        const results = await Promise.allSettled([
          service.create(userId(1), preferences()),
          service.create(userId(1), preferences()),
        ]);

        expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
        const rejected = results.find((result) => result.status === 'rejected');
        expect(rejected && rejected.status === 'rejected' && rejected.reason).toMatchObject({ statusCode: 409, data: { code: 'REQUEST_ALREADY_EXISTS' } });

        const count =
          await prisma.mentorParticipationRequest.count({
            where: {
              userId: userId(1),
              status: 'PENDING',
            },
          });

        expect(count).toBe(1);
      });

      it('mantiene la posicion FIFO al modificar preferencias', async () => {
        const original = await service.create(
          userId(1),
          preferences(),
        );

        const updated = await service.updatePreferences(
          userId(1),
          preferences(),
        );

        expect(updated.id).toBe(original.id);
        expect(updated.queuedAt).toEqual(original.queuedAt);

        const saved =
          await prisma.mentorParticipationRequest.findUnique({
            where: { id: original.id },
          });

        expect(saved?.queuedAt).toEqual(original.queuedAt);
      });

      it('cancela una solicitud sin eliminar su historial', async () => {
        const original = await service.create(
          userId(1),
          preferences(),
        );

        const cancelled = await service.cancel(userId(1));

        expect(cancelled.id).toBe(original.id);
        expect(cancelled.status).toBe('CANCELLED');

        const saved =
          await prisma.mentorParticipationRequest.findUnique({
            where: { id: original.id },
          });

        expect(saved).not.toBeNull();
        expect(saved?.status).toBe('CANCELLED');
      });

      it('no permite editar solicitudes con una oferta vigente', async () => {
        const original = await service.create(
          userId(1),
          preferences(),
        );

        await prisma.mentorParticipationRequest.update({
          where: { id: original.id },
          data: { status: 'OFFERED' },
        });

        await expect(
          service.updatePreferences(userId(1), preferences()),
        ).rejects.toMatchObject({
          statusCode: 404,
        });

        const saved =
          await prisma.mentorParticipationRequest.findUnique({
            where: { id: original.id },
          });

        expect(saved?.status).toBe('OFFERED');
      });

      it('no permite cancelar solicitudes de otro usuario', async () => {
        const original = await service.create(
          userId(1),
          preferences(),
        );

        await expect(
          service.cancel(userId(2)),
        ).rejects.toMatchObject({
          statusCode: 404,
        });

        const saved =
          await prisma.mentorParticipationRequest.findUnique({
            where: { id: original.id },
          });

        expect(saved?.status).toBe('PENDING');
      });

      it('incluye solicitudes canceladas en el historial', async () => {
        const original = await service.create(
          userId(1),
          preferences(),
        );

        await service.cancel(userId(1));

        const history = await service.findMyHistory(userId(1));

        expect(history).toHaveLength(1);
        expect(history[0].id).toBe(original.id);
        expect(history[0].status).toBe('CANCELLED');
      });

      it('incluye solicitudes vencidas en el historial', async () => {
        const original = await service.create(
          userId(1),
          preferences(),
        );

        await prisma.mentorParticipationRequest.update({
          where: { id: original.id },
          data: { status: 'EXPIRED' },
        });

        const history = await service.findMyHistory(userId(1));

        expect(history).toHaveLength(1);
        expect(history[0].id).toBe(original.id);
        expect(history[0].status).toBe('EXPIRED');
      });

      it('no muestra solicitudes de otros usuarios en el historial', async () => {
        const first = await service.create(
          userId(1),
          preferences(),
        );

        const second = await service.create(
          userId(2),
          preferences(),
        );

        const history = await service.findMyHistory(userId(1));

        expect(history).toHaveLength(1);
        expect(history[0].id).toBe(first.id);
        expect(history.some((item) => item.id === second.id)).toBe(false);
      });
    });

    describe('HU7-4: intentos y sanciones', () => {
      async function countedAttempt() {
        try {
          return await service.create(userId(1), preferences());
        } catch (error) {
          if ((error as { data?: { code?: string } }).data?.code !== 'REQUEST_ALREADY_EXISTS') throw error;
          expect(error).toMatchObject({ statusCode: 409 });
          return prisma.mentorParticipationRequest.findFirstOrThrow({ where: { userId: userId(1), status: 'PENDING' } });
        }
      }

      it('permite cuatro intentos dentro de 24 horas', async () => {
        const requests: Awaited<ReturnType<MentorParticipationService['create']>>[] = [];

        for (let attempt = 0; attempt < 4; attempt += 1) {
          requests.push(
            await countedAttempt(),
          );
        }

        expect(requests).toHaveLength(4);
        expect(requests.every((request) => request.id === requests[0].id))
          .toBe(true);

        const limit =
          await prisma.mentorParticipationAttemptLimit.findUnique({
            where: { userId: userId(1) },
          });

        expect(limit?.attemptCount).toBe(4);
        expect(limit?.blockedUntil).toBeNull();
      });

      it('devuelve HTTP 429 al quinto intento y registra la sancion', async () => {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          await countedAttempt();
        }

        const before = new Date();

        await expect(
          countedAttempt(),
        ).rejects.toMatchObject({
          statusCode: 429,
        });

        const after = new Date();

        const limit =
          await prisma.mentorParticipationAttemptLimit.findUnique({
            where: { userId: userId(1) },
          });

        expect(limit?.attemptCount).toBe(5);
        expect(limit?.blockedUntil).not.toBeNull();

        const blockedUntil = limit!.blockedUntil!.getTime();

        expect(blockedUntil).toBeGreaterThanOrEqual(
          before.getTime() + 72 * 60 * 60 * 1000,
        );

        expect(blockedUntil).toBeLessThanOrEqual(
          after.getTime() + 72 * 60 * 60 * 1000,
        );
      });

      it('rechaza nuevos intentos mientras la sancion esta vigente', async () => {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          await countedAttempt();
        }

        await expect(
          countedAttempt(),
        ).rejects.toMatchObject({
          statusCode: 429,
        });

        const original =
          await prisma.mentorParticipationAttemptLimit.findUniqueOrThrow({
            where: { userId: userId(1) },
          });

        await expect(
          countedAttempt(),
        ).rejects.toMatchObject({
          statusCode: 429,
        });

        const current =
          await prisma.mentorParticipationAttemptLimit.findUniqueOrThrow({
            where: { userId: userId(1) },
          });

        expect(current.attemptCount).toBe(5);
        expect(current.blockedUntil).toEqual(original.blockedUntil);
      });

      it('permite volver a intentar cuando finaliza la sancion', async () => {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          await countedAttempt();
        }

        await expect(
          countedAttempt(),
        ).rejects.toMatchObject({
          statusCode: 429,
        });

        await prisma.mentorParticipationAttemptLimit.update({
          where: { userId: userId(1) },
          data: {
            blockedUntil: new Date(Date.now() - 1000),
          },
        });

        const result = await countedAttempt();

        expect(result.status).toBe('PENDING');

        const limit =
          await prisma.mentorParticipationAttemptLimit.findUniqueOrThrow({
            where: { userId: userId(1) },
          });

        expect(limit.attemptCount).toBe(1);
        expect(limit.blockedUntil).toBeNull();
      });

      it('reinicia el contador despues de 24 horas', async () => {
        await countedAttempt();
        await countedAttempt();

        await prisma.mentorParticipationAttemptLimit.update({
          where: { userId: userId(1) },
          data: {
            windowStartedAt: new Date(
              Date.now() - 25 * 60 * 60 * 1000,
            ),
          },
        });

        await countedAttempt();

        const limit =
          await prisma.mentorParticipationAttemptLimit.findUniqueOrThrow({
            where: { userId: userId(1) },
          });

        expect(limit.attemptCount).toBe(1);
        expect(limit.blockedUntil).toBeNull();
      });
    });
  },
);
