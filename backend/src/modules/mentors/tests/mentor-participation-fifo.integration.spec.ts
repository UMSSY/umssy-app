import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../prisma/client.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';

const connectionString = process.env.HU7_TEST_DATABASE_URL;
const schema = `hu7_participation_test_${randomBytes(6).toString('hex')}`;
const userId = (number: number) =>
  `14370000-0000-4000-8000-${String(number).padStart(12, '0')}`;

describe.skipIf(!connectionString)(
  'HU7-2: solicitudes FIFO en PostgreSQL',
  () => {
    let admin: pg.Client;
    let prisma: PrismaClient;
    let repository: MentorParticipationRepository;
    let service: MentorParticipationService;
    let areaId: string,
      secondAreaId: string,
      orientationId: string,
      mentorRoleId: string;
    let created = false;

    beforeAll(async () => {
      if (
        !['localhost', '127.0.0.1', '[::1]'].includes(
          new URL(connectionString!).hostname,
        )
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
      for (const name of (await readdir(migrations))
        .filter((entry) => /^\d/.test(entry))
        .sort()) {
        await admin.query(
          await readFile(new URL(`${name}/migration.sql`, migrations), 'utf8'),
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
      repository = new MentorParticipationRepository(
        prisma as unknown as PrismaService,
      );
      service = new MentorParticipationService(repository);
      const graduate = await prisma.role.create({ data: { name: 'titulado' } });
      mentorRoleId = (await prisma.role.create({ data: { name: 'mentor' } }))
        .id;
      const approved = await prisma.accessRequestStatus.create({
        data: { title: 'approved' },
      });
      const career = await prisma.career.create({
        data: { title: 'HU7 participation' },
      });
      areaId = (
        await prisma.technicalArea.create({ data: { name: 'Area inicial' } })
      ).id;
      secondAreaId = (
        await prisma.technicalArea.create({ data: { name: 'Area corregida' } })
      ).id;
      orientationId = (
        await prisma.orientationType.create({
          data: { name: 'Orientación HU7' },
        })
      ).id;
      for (let number = 1; number <= 5; number += 1) {
        const id = userId(number),
          email = `participation.${number}@example.test`;
        await prisma.user.create({
          data: { id, firstName: 'HU7', lastName: String(number), email },
        });
        await prisma.userRole.create({
          data: { userId: id, roleId: graduate.id },
        });
        const access = await prisma.accessRequest.create({
          data: {
            firstName: 'HU7',
            lastName: String(number),
            email,
            idCardNumber: `1437000${number}`,
            sisCode: `14370000${number}`,
            idCardIssuedIn: 'CB',
            birthDate: new Date('1990-01-01'),
            graduationYear: 2025,
            careerId: career.id,
            statusId: approved.id,
          },
        });
        await prisma.$executeRaw`UPDATE access_requests SET approved_user_id = ${id}::uuid WHERE id = ${access.id}::uuid`;
      }
    }, 30_000);

    afterAll(async () => {
      await prisma?.$disconnect();
      if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      await admin?.end();
    });

    beforeEach(async () => {
      await prisma.mentorParticipationAttemptLimit.deleteMany();
      await prisma.$executeRaw`TRUNCATE mentor_slot_offers, mentor_participation_requests`;
      await prisma.userRole.deleteMany({ where: { roleId: mentorRoleId } });
      await prisma.userRole.createMany({
        data: [4, 5].map((number) => ({
          userId: userId(number),
          roleId: mentorRoleId,
        })),
      });
      await prisma.user.updateMany({ data: { isActive: true } });
      await prisma.orientationType.update({
        where: { id: orientationId },
        data: { isActive: true },
      });
    });
    const preferences = () => ({
      technicalAreaIds: [areaId],
      orientationTypeIds: [orientationId],
    });
    const queue = () => prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM mentor_participation_requests WHERE status = 'PENDING' ORDER BY queued_at, id`;
    const allocator = () =>
      new MentorOffersRepository(prisma as unknown as PrismaService);

    it('persiste fecha, usuario y preferencias; consulta solo los datos del usuario autenticado', async () => {
      expect(await service.findMyRequest(userId(1))).toBeNull();
      const request = await service.create(userId(1), preferences());
      expect(request).toMatchObject({
        userId: userId(1),
        status: 'PENDING',
        ...preferences(),
      });
      expect(request.queuedAt).toBeInstanceOf(Date);
      expect(request.createdAt).toEqual(request.queuedAt);
      expect(await service.findMyRequest(userId(1))).toMatchObject(request);
      expect(await service.findMyRequest(userId(2))).toBeNull();
      expect(await service.findMyHistory(userId(2))).toEqual([]);
    });

    it('dos creaciones simultáneas conservan el mismo ID y fecha, incluso si cambian las preferencias', async () => {
      const results = await Promise.allSettled([
        service.create(userId(1), preferences()),
        service.create(userId(1), preferences()),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((result) => result.status === 'rejected');
      expect(rejected?.status === 'rejected' && rejected.reason).toMatchObject({ statusCode: 409 });
      const original = await service.findMyRequest(userId(1));
      await expect(service.create(userId(1), {
        ...preferences(), technicalAreaIds: [secondAreaId],
      })).rejects.toMatchObject({ statusCode: 409, data: { code: 'REQUEST_ALREADY_EXISTS' } });
      expect(await service.findMyRequest(userId(1))).toEqual(original);
      expect(await service.findMyHistory(userId(1))).toHaveLength(1);
    });

    it('corrige las preferencias reales sin cambiar ID, fecha ni orden FIFO', async () => {
      const first = await service.create(userId(1), preferences());
      const second = await service.create(userId(2), preferences());
      const corrected = await service.updatePreferences(userId(1), {
        ...preferences(),
        technicalAreaIds: [secondAreaId],
      });
      expect(corrected).toEqual({ ...first, technicalAreaIds: [secondAreaId] });
      expect(await queue()).toEqual([{ id: first.id }, { id: second.id }]);
    });

    it('cancelar conserva el historial y el orden de quienes siguen; una nueva solicitud queda al final', async () => {
      const first = await service.create(userId(1), preferences());
      const second = await service.create(userId(2), preferences());
      const third = await service.create(userId(3), preferences());
      expect(await service.cancel(userId(1))).toEqual({
        ...first,
        status: 'CANCELLED',
      });
      expect(await service.findMyRequest(userId(1))).toMatchObject({ status: 'CANCELLED' });
      const returned = await service.create(userId(1), preferences());
      expect(returned.id).not.toBe(first.id);
      expect(returned.queuedAt.getTime()).toBeGreaterThan(
        first.queuedAt.getTime(),
      );
      expect(await queue()).toEqual([
        { id: second.id },
        { id: third.id },
        { id: returned.id },
      ]);
      expect(await service.findMyHistory(userId(1))).toEqual([
        returned,
        { ...first, status: 'CANCELLED' },
      ]);
    });

    it('duplicar una oferta vigente conserva la solicitud original y no permite editarla ni cancelarla', async () => {
      const first = await service.create(userId(1), preferences());
      await prisma.userRole.deleteMany({
        where: { userId: userId(5), roleId: mentorRoleId },
      });
      await allocator().reconcile();
      const original = { ...first, status: 'OFFERED' };
      await expect(service.create(userId(1), preferences())).rejects.toMatchObject({ statusCode: 409, data: { code: 'REQUEST_ALREADY_EXISTS' } });
      await expect(
        service.updatePreferences(userId(1), preferences()),
      ).rejects.toMatchObject({ statusCode: 404 });
      await expect(service.cancel(userId(1))).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(await service.findMyHistory(userId(1))).toEqual([original]);
    });

    it('una oferta previa sin solicitud asociada también impide otra solicitud vigente', async () => {
      await prisma.$executeRaw`INSERT INTO mentor_slot_offers (id, user_id, expires_at)
      VALUES (gen_random_uuid(), ${userId(1)}::uuid, clock_timestamp() + interval '24 hours')`;
      await expect(
        service.create(userId(1), preferences()),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(await service.findMyHistory(userId(1))).toEqual([]);
    });

    it('resuelve ofertas vencidas antes de volver a postular y conserva ambos registros', async () => {
      const original = await service.create(userId(1), preferences());
      await prisma.$executeRaw`UPDATE mentor_participation_requests SET status = 'OFFERED' WHERE id = ${original.id}::uuid`;
      await prisma.$executeRaw`INSERT INTO mentor_slot_offers (id, user_id, request_id, expires_at)
      VALUES (gen_random_uuid(), ${userId(1)}::uuid, ${original.id}::uuid, clock_timestamp())`;
      const returned = await service.create(userId(1), preferences());
      expect(returned.status).toBe('PENDING');
      expect(returned.id).not.toBe(original.id);
      expect(await service.findMyHistory(userId(1))).toEqual([
        returned,
        { ...original, status: 'EXPIRED' },
      ]);
    });

    it('rechaza usuarios inactivos o ya mentores y rechaza solicitudes si hay cupo libre', async () => {
      await prisma.user.update({
        where: { id: userId(1) },
        data: { isActive: false },
      });
      await expect(
        service.create(userId(1), preferences()),
      ).rejects.toMatchObject({ statusCode: 403 });
      await expect(
        service.create(userId(4), preferences()),
      ).rejects.toMatchObject({ statusCode: 403 });
      await prisma.user.update({
        where: { id: userId(1) },
        data: { isActive: true },
      });
      await prisma.userRole.deleteMany({
        where: { userId: userId(5), roleId: mentorRoleId },
      });
      await expect(
        service.create(userId(2), preferences()),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(await queue()).toEqual([]);
    });

    it('al admitir solicitudes nuevas atiende primero a quienes ya estaban esperando', async () => {
      const first = await service.create(userId(1), preferences());
      await prisma.userRole.deleteMany({
        where: { userId: userId(5), roleId: mentorRoleId },
      });
      const next = await service.create(userId(2), preferences());
      expect(next.status).toBe('PENDING');
      expect(await service.findMyRequest(userId(1))).toMatchObject({
        id: first.id,
        status: 'OFFERED',
      });
    });

    it('rechaza preferencias inválidas al crear y editar sin alterar la solicitud', async () => {
      const request = await service.create(userId(1), preferences());
      for (const invalid of [[], [areaId, areaId], [userId(1)]]) {
        await expect(
          service.create(userId(2), {
            ...preferences(),
            technicalAreaIds: invalid,
          }),
        ).rejects.toMatchObject({ statusCode: 400 });
        await expect(
          service.updatePreferences(userId(1), {
            ...preferences(),
            technicalAreaIds: invalid,
          }),
        ).rejects.toMatchObject({ statusCode: 400 });
      }
      await prisma.orientationType.update({
        where: { id: orientationId },
        data: { isActive: false },
      });
      await expect(
        service.updatePreferences(userId(1), preferences()),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(await service.findMyRequest(userId(1))).toMatchObject(request);
    });

    it('no permite modificar ni cancelar la solicitud de otro usuario y repetir cancelación no cambia la cola', async () => {
      const request = await service.create(userId(1), preferences());
      await expect(service.cancel(userId(2))).rejects.toMatchObject({
        statusCode: 404,
      });
      await expect(
        service.updatePreferences(userId(2), preferences()),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(await service.findMyRequest(userId(1))).toMatchObject(request);
      await service.cancel(userId(1));
      await expect(service.cancel(userId(1))).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(await service.findMyHistory(userId(1))).toEqual([
        { ...request, status: 'CANCELLED' },
      ]);
    });
  },
);
