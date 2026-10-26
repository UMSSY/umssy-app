// HU7_TEST_DATABASE_URL debe apuntar a PostgreSQL local. Cada ejecución crea y elimina su propio esquema.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../prisma/client.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorOffersService } from '../services/mentor-offers.service.js';
import { MentorOffersWorker } from '../services/mentor-offers-worker.service.js';

const connectionString = process.env.HU7_TEST_DATABASE_URL;
const schema = `hu7_offer_test_${randomBytes(6).toString('hex')}`;
const uuid = (kind: string, number: number) => `14380000-0000-4000-${kind}-${String(number).padStart(12, '0')}`;
type Offer = { id: string; userId: string; requestId: string; status: string; offeredAt: Date; expiresAt: Date };

describe.skipIf(!connectionString)('FIFO y ofertas HU7 en PostgreSQL', () => {
  let admin: pg.Client;
  let prisma: PrismaClient;
  let service: MentorOffersService;
  let mentorRoleId: string;
  let areaId: string;
  let orientationId: string;
  let created = false;

  beforeAll(async () => {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(connectionString!).hostname)) {
      throw new Error('Esta prueba solo utiliza PostgreSQL local');
    }
    admin = new pg.Client({ connectionString });
    await admin.connect();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    created = true;
    await admin.query(`SET search_path TO "${schema}", public`);
    const migrations = new URL('../../../../prisma/migrations/', import.meta.url);
    for (const name of (await readdir(migrations)).filter((entry) => /^\d/.test(entry)).sort()) {
      await admin.query(await readFile(new URL(`${name}/migration.sql`, migrations), 'utf8'));
    }
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString,
      options: `-c search_path=${schema} -c TimeZone=UTC` }, { schema }) });
    service = new MentorOffersService(new MentorOffersRepository(prisma as unknown as PrismaService));
    await prisma.$transaction(async (tx) => {
      const graduate = await tx.role.create({ data: { name: 'titulado' } });
      mentorRoleId = (await tx.role.create({ data: { name: 'mentor' } })).id;
      const status = await tx.accessRequestStatus.create({ data: { title: 'approved' } });
      const career = await tx.career.create({ data: { title: 'HU7 test' } });
      areaId = (await tx.technicalArea.create({ data: { name: 'HU7 test' } })).id;
      orientationId = (await tx.orientationType.create({ data: { name: 'HU7 test' } })).id;
      for (let number = 1; number <= 3; number += 1) {
        const userId = uuid('8000', number), requestId = uuid('9000', number);
        const email = `hu7.${number}@example.test`;
        await tx.user.create({ data: { id: userId, firstName: 'HU7', lastName: String(number), email } });
        await tx.userRole.create({ data: { userId, roleId: graduate.id } });
        await tx.accessRequest.create({ data: { id: requestId, firstName: 'HU7', lastName: String(number),
          email, idCardNumber: `1438000${number}`, sisCode: `14380000${number}`, idCardIssuedIn: 'CB',
          birthDate: new Date('1990-01-01'), graduationYear: 2025, careerId: career.id, statusId: status.id } });
        await tx.$executeRaw`UPDATE access_requests SET approved_user_id = ${userId}::uuid WHERE id = ${requestId}::uuid`;
      }
    });
  }, 30_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    if (created) await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin?.end();
  });

  async function enqueue(number: number, user: number, queuedAt: string) {
    await prisma.$executeRaw`
      INSERT INTO mentor_participation_requests (id, user_id, queued_at, technical_area_ids, orientation_type_ids)
      VALUES (${uuid('a000', number)}::uuid, ${uuid('8000', user)}::uuid, ${queuedAt}::timestamptz,
        ARRAY[${areaId}::uuid], ARRAY[${orientationId}::uuid])`;
  }
  const offers = () => prisma.$queryRaw<Offer[]>`
    SELECT id, user_id AS "userId", request_id AS "requestId", status,
      offered_at AS "offeredAt", expires_at AS "expiresAt" FROM mentor_slot_offers ORDER BY offered_at, id`;
  async function expireCurrent() {
    await prisma.$executeRaw`UPDATE mentor_slot_offers SET expires_at = clock_timestamp() WHERE status = 'OFFERED'`;
  }

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE mentor_slot_offers, mentor_participation_requests`;
    await prisma.userRole.deleteMany({ where: { roleId: mentorRoleId } });
    await prisma.mentorTechnicalArea.deleteMany();
    await prisma.mentorOrientationType.deleteMany();
    await prisma.orientationType.update({ where: { id: orientationId }, data: { isActive: true } });
    await enqueue(2, 1, '2020-01-01T00:00:00Z');
    await enqueue(1, 2, '2020-01-01T00:00:00Z');
    await enqueue(3, 3, '2020-01-01T00:01:00Z');
  });

  it('ordena por queuedAt e id y dos asignaciones simultáneas reservan un solo cupo', async () => {
    await Promise.all([service.reconcile(), service.reconcile()]);
    const records = await offers();
    expect(records).toHaveLength(1);
    expect(records[0].requestId).toBe(uuid('a000', 1));
    expect(records[0].expiresAt.getTime() - records[0].offeredAt.getTime()).toBe(24 * 3_600_000);
    expect(await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${uuid('a000', 2)}::uuid`)
      .toEqual([{ status: 'PENDING' }]);
  });

  it('confirma una vez bajo concurrencia y rechaza la oferta de otro usuario', async () => {
    await service.reconcile();
    const [offer] = await offers();
    await expect(service.confirm(uuid('8000', 1), offer.id)).rejects.toMatchObject({ statusCode: 404 });
    const confirmations = await Promise.all([service.confirm(offer.userId, offer.id), service.confirm(offer.userId, offer.id)]);
    expect(confirmations.map(({ alreadyConfirmed }) => alreadyConfirmed).sort((left, right) => Number(left) - Number(right))).toEqual([false, true]);
    expect(await prisma.userRole.count({ where: { roleId: mentorRoleId } })).toBe(1);
    expect(await prisma.mentorTechnicalArea.count()).toBe(1);
    expect(await new MentorsRepository(prisma as unknown as PrismaService).capacity()).toMatchObject({ activeMentors: 1, reservedOffers: 0, available: 0 });
  });

  it('vence y reasigna sin visita del usuario; una postulación nueva entra al final', async () => {
    const worker = new MentorOffersWorker(service);
    await worker.tick();
    const [original] = await offers();
    await expireCurrent();
    await worker.tick();
    await expect(service.confirm(original.userId, original.id)).rejects.toMatchObject({ statusCode: 409 });
    expect(await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${original.requestId}::uuid`)
      .toEqual([{ status: 'EXPIRED' }]);
    await enqueue(4, 2, new Date().toISOString());
    expect((await offers()).find(({ status }) => status === 'OFFERED')?.requestId).toBe(uuid('a000', 2));
    await expireCurrent(); await worker.tick();
    expect((await offers()).find(({ status }) => status === 'OFFERED')?.requestId).toBe(uuid('a000', 3));
    await expireCurrent(); await worker.tick();
    expect((await offers()).find(({ status }) => status === 'OFFERED')?.requestId).toBe(uuid('a000', 4));
  });

  it('el alta directa no adelanta a quienes esperan en FIFO', async () => {
    const repository = new MentorsRepository(prisma as unknown as PrismaService);
    await expect(repository.activate(uuid('8000', 3), mentorRoleId, [areaId], [orientationId])).rejects.toMatchObject({ statusCode: 409 });
    expect(await prisma.userRole.count({ where: { roleId: mentorRoleId } })).toBe(0);
    await service.reconcile();
    expect((await offers())[0].requestId).toBe(uuid('a000', 1));
  });

  it('no activa ni confirma parcialmente si la orientación deja de ser válida', async () => {
    await service.reconcile();
    const [offer] = await offers();
    await prisma.orientationType.update({ where: { id: orientationId }, data: { isActive: false } });
    await expect(service.confirm(offer.userId, offer.id)).rejects.toMatchObject({ statusCode: 400 });
    expect((await offers())[0].status).toBe('OFFERED');
    expect(await prisma.userRole.count({ where: { roleId: mentorRoleId } })).toBe(0);
  });
});
