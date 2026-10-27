// HU7_TEST_DATABASE_URL debe apuntar a PostgreSQL local. Cada ejecución crea y elimina su propio esquema.
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
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
import { MentorExitRepository } from '../repositories/mentor-exit.repository.js';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorMailOutboxService } from '../services/mentor-mail-outbox.service.js';
import { MailService } from '../../mail/services/mail.service.js';
import { MailTemplateService } from '../../mail/services/mail-template.service.js';

const connectionString = process.env.HU7_TEST_DATABASE_URL;
const schema = `hu7_offer_test_${randomBytes(6).toString('hex')}`;
const uuid = (kind: string, number: number) =>
  `14380000-0000-4000-${kind}-${String(number).padStart(12, '0')}`;
type Offer = {
  id: string;
  userId: string;
  requestId: string;
  status: string;
  offeredAt: Date;
  expiresAt: Date;
};

describe.skipIf(!connectionString)('FIFO y ofertas HU7 en PostgreSQL', () => {
  let admin: pg.Client;
  let prisma: PrismaClient;
  let service: MentorOffersService;
  let mentorRoleId: string;
  let areaId: string;
  let orientationId: string;
  let created = false;

  beforeAll(async () => {
    if (
      !['localhost', '127.0.0.1', '[::1]'].includes(
        new URL(connectionString!).hostname,
      )
    ) {
      throw new Error('Esta prueba solo utiliza PostgreSQL local');
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
    service = new MentorOffersService(
      new MentorOffersRepository(prisma as unknown as PrismaService),
    );
    await prisma.$transaction(async (tx) => {
      const graduate = await tx.role.create({ data: { name: 'titulado' } });
      mentorRoleId = (await tx.role.create({ data: { name: 'mentor' } })).id;
      const status = await tx.accessRequestStatus.create({
        data: { title: 'approved' },
      });
      const career = await tx.career.create({ data: { title: 'HU7 test' } });
      areaId = (await tx.technicalArea.create({ data: { name: 'HU7 test' } }))
        .id;
      orientationId = (
        await tx.orientationType.create({ data: { name: 'HU7 test' } })
      ).id;
      for (let number = 1; number <= 3; number += 1) {
        const userId = uuid('8000', number),
          requestId = uuid('9000', number);
        const email = `hu7.${number}@example.test`;
        await tx.user.create({
          data: {
            id: userId,
            firstName: 'HU7',
            lastName: String(number),
            email,
          },
        });
        await tx.userRole.create({ data: { userId, roleId: graduate.id } });
        await tx.accessRequest.create({
          data: {
            id: requestId,
            firstName: 'HU7',
            lastName: String(number),
            email,
            idCardNumber: `1438000${number}`,
            sisCode: `14380000${number}`,
            idCardIssuedIn: 'CB',
            birthDate: new Date('1990-01-01'),
            graduationYear: 2025,
            careerId: career.id,
            statusId: status.id,
          },
        });
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
    await prisma.appointment.deleteMany();
    await prisma.$executeRaw`TRUNCATE mentor_mail_outbox, mentor_slot_offers, mentor_participation_requests`;
    await prisma.user.updateMany({ data: { isActive: true } });
    await prisma.userRole.deleteMany({ where: { roleId: mentorRoleId } });
    await prisma.mentorTechnicalArea.deleteMany();
    await prisma.mentorOrientationType.deleteMany();
    await prisma.orientationType.update({
      where: { id: orientationId },
      data: { isActive: true },
    });
    await enqueue(2, 1, '2020-01-01T00:00:00Z');
    await enqueue(1, 2, '2020-01-01T00:00:00Z');
    await enqueue(3, 3, '2020-01-01T00:01:00Z');
  });

  it('ordena por queuedAt e id y dos asignaciones simultáneas reservan un solo cupo', async () => {
    await Promise.all([service.reconcile(), service.reconcile()]);
    const records = await offers();
    expect(records).toHaveLength(1);
    expect(records[0].requestId).toBe(uuid('a000', 1));
    expect(
      records[0].expiresAt.getTime() - records[0].offeredAt.getTime(),
    ).toBe(24 * 3_600_000);
    expect(
      await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${uuid('a000', 2)}::uuid`,
    ).toEqual([{ status: 'PENDING' }]);
  });

  it('conserva una reserva al reducir capacidad y confirmarla no duplica la ocupación', async () => {
    await service.reconcile();
    const [offer] = await offers();
    await prisma.user.update({
      where: { id: uuid('8000', 3) },
      data: { isActive: false },
    });
    const repository = new MentorsRepository(
      prisma as unknown as PrismaService,
    );
    expect(await repository.capacity()).toMatchObject({
      capacity: 0,
      reservedOffers: 1,
      available: 0,
    });
    await service.confirm(offer.userId, offer.id);
    await service.reconcile();
    expect(await repository.capacity()).toMatchObject({
      capacity: 0,
      activeMentors: 1,
      reservedOffers: 0,
      available: 0,
    });
    expect(await offers()).toHaveLength(1);
    await expect(
      repository.activate(
        uuid('8000', 1),
        mentorRoleId,
        [areaId],
        [orientationId],
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  describe('correo transaccional de ofertas', () => {
    const outbox = (mail: {
      isSmtpConfigured: () => boolean;
      send: ReturnType<typeof vi.fn>;
    }) =>
      new MentorMailOutboxService(
        prisma as unknown as PrismaService,
        mail as unknown as MailService,
      );
    const smtp = () => ({
      isSmtpConfigured: () => true,
      send: vi.fn().mockResolvedValue(undefined),
    });

    it('crea un evento para el único ofertado y dos despachadores lo envían una vez al correo institucional', async () => {
      await Promise.all([service.reconcile(), service.reconcile()]);
      const mail = smtp();
      await Promise.all([outbox(mail).dispatch(), outbox(mail).dispatch()]);
      await outbox(mail).dispatch();
      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'hu7.2@example.test',
          text: expect.stringContaining('24 horas'),
          messageId: expect.stringContaining('@mentor-notifications.umssy>'),
        }),
      );
      expect(await prisma.mentorMailOutbox.count()).toBe(1);
      expect(await prisma.mentorMailOutbox.findFirstOrThrow()).toMatchObject({
        status: 'SENT',
        attempts: 1,
      });
    });

    it('un fallo previo a la aceptación permite reintento y conserva el mismo Message-ID', async () => {
      await service.reconcile();
      const mail = smtp();
      mail.send.mockRejectedValueOnce({ code: 'ECONNECTION' });
      await outbox(mail).dispatch();
      expect(await prisma.mentorMailOutbox.findFirstOrThrow()).toMatchObject({
        status: 'PENDING',
        attempts: 1,
      });
      await prisma.mentorMailOutbox.updateMany({
        data: { availableAt: new Date(0) },
      });
      await outbox(mail).dispatch();
      expect(mail.send).toHaveBeenCalledTimes(2);
      expect(mail.send.mock.calls[0][0].messageId).toBe(
        mail.send.mock.calls[1][0].messageId,
      );
      expect(await prisma.mentorMailOutbox.findFirstOrThrow()).toMatchObject({
        status: 'SENT',
        attempts: 2,
      });
    });

    it('un resultado SMTP ambiguo se aísla y no se reenvía al reiniciar el worker', async () => {
      await service.reconcile();
      const mail = smtp();
      mail.send.mockRejectedValueOnce({ code: 'ETIMEDOUT', command: 'DATA' });
      await outbox(mail).dispatch();
      await outbox(mail).dispatch();
      expect(mail.send).toHaveBeenCalledTimes(1);
      expect(await prisma.mentorMailOutbox.findFirstOrThrow()).toMatchObject({
        status: 'UNCERTAIN',
      });
    });

    it('recupera un despacho interrumpido sin duplicarlo y consola no afirma entrega real', async () => {
      await service.reconcile();
      const mail = smtp();
      await outbox({ ...mail, isSmtpConfigured: () => false }).dispatch();
      expect(await prisma.mentorMailOutbox.findFirstOrThrow()).toMatchObject({
        status: 'PENDING',
        attempts: 0,
      });
      await prisma.mentorMailOutbox.updateMany({
        data: { status: 'SENDING', claimedAt: new Date(0) },
      });
      await outbox(mail).dispatch();
      expect(mail.send).not.toHaveBeenCalled();
      expect(await prisma.mentorMailOutbox.findFirstOrThrow()).toMatchObject({
        status: 'UNCERTAIN',
        lastError: 'DISPATCH_INTERRUPTED',
      });
    });

    it('no envía una oferta que venció mientras esperaba el proveedor', async () => {
      await service.reconcile();
      await expireCurrent();
      const mail = smtp();
      await outbox(mail).dispatch();
      expect(mail.send).not.toHaveBeenCalled();
      expect(await prisma.mentorMailOutbox.findFirstOrThrow()).toMatchObject({
        status: 'SUPERSEDED',
        sentAt: null,
      });
    });

    it.skipIf(!process.env.HU7_TEST_SMTP_PORT)(
      'entrega por SMTP local una oferta y sanción sin duplicados al receptor de prueba',
      async () => {
        vi.stubEnv('MAIL_TRANSPORT', 'smtp');
        vi.stubEnv('SMTP_HOST', '127.0.0.1');
        vi.stubEnv('SMTP_PORT', process.env.HU7_TEST_SMTP_PORT!);
        vi.stubEnv('SMTP_USER', '');
        vi.stubEnv('SMTP_PASSWORD', '');
        vi.stubEnv('SMTP_SECURE', 'false');
        vi.stubEnv('SMTP_REQUIRE_TLS', 'false');
        try {
          await service.reconcile();
          await prisma.mentorMailOutbox.create({
            data: {
              eventKey: 'smtp-sanction',
              kind: 'SANCTION',
              userId: uuid('8000', 1),
              recipient: 'hu7.1@example.test',
              payload: {
                sanctionEndsAt: new Date(
                  Date.now() + 72 * 3600000,
                ).toISOString(),
              },
            },
          });
          const sender = new MentorMailOutboxService(
            prisma as unknown as PrismaService,
            new MailService(new MailTemplateService()),
          );
          await sender.dispatch();
          await sender.dispatch();
          expect(
            await prisma.mentorMailOutbox.count({ where: { status: 'SENT' } }),
          ).toBe(2);
        } finally {
          vi.unstubAllEnvs();
        }
      },
    );
  });

  it('expone la oferta y el correo propios y conserva el estado vencido para el frontend', async () => {
    const participation = new MentorParticipationRepository(
      prisma as unknown as PrismaService,
    );
    const current = await participation.findMyRequest(uuid('8000', 2));
    expect(current).toMatchObject({
      status: 'OFFERED',
      email: 'hu7.2@example.test',
    });
    expect(current?.offer?.id).toBe((await offers())[0].id);
    if (!current?.offer) throw new Error('No se devolvió la oferta asignada');
    expect(
      current.offer.expiresAt.getTime() - current.offer.offeredAt.getTime(),
    ).toBe(24 * 3_600_000);
    await expireCurrent();
    expect(await participation.findMyRequest(uuid('8000', 2))).toMatchObject({
      status: 'EXPIRED',
      offer: { status: 'EXPIRED' },
    });
    expect(await participation.findMyRequest(uuid('8000', 1))).toMatchObject({
      status: 'OFFERED',
    });
  });

  it('una solicitud cerrada no oculta una activación directa posterior', async () => {
    const participation = new MentorParticipationRepository(
      prisma as unknown as PrismaService,
    );
    await prisma.mentorParticipationRequest.updateMany({
      data: { status: 'CANCELLED' },
    });
    const repository = new MentorsRepository(
      prisma as unknown as PrismaService,
    );
    await repository.activate(
      uuid('8000', 1),
      mentorRoleId,
      [areaId],
      [orientationId],
    );
    expect(await participation.findMyRequest(uuid('8000', 1))).toBeNull();
    expect(await participation.findMyRequest(uuid('8000', 2))).toMatchObject({
      status: 'CANCELLED',
    });
  });

  it('confirma una vez bajo concurrencia y rechaza la oferta de otro usuario', async () => {
    await service.reconcile();
    const [offer] = await offers();
    await expect(
      service.confirm(uuid('8000', 1), offer.id),
    ).rejects.toMatchObject({ statusCode: 404 });
    const confirmations = await Promise.all([
      service.confirm(offer.userId, offer.id),
      service.confirm(offer.userId, offer.id),
    ]);
    expect(
      confirmations
        .map(({ alreadyConfirmed }) => alreadyConfirmed)
        .sort((left, right) => Number(left) - Number(right)),
    ).toEqual([false, true]);
    expect(
      await prisma.userRole.count({ where: { roleId: mentorRoleId } }),
    ).toBe(1);
    expect(await prisma.mentorTechnicalArea.count()).toBe(1);
    expect(
      await new MentorsRepository(
        prisma as unknown as PrismaService,
      ).capacity(),
    ).toMatchObject({ activeMentors: 1, reservedOffers: 0, available: 0 });
  });

  it('vence y reasigna sin visita del usuario; una postulación nueva entra al final', async () => {
    const worker = new MentorOffersWorker(service);
    await worker.tick();
    const [original] = await offers();
    await expireCurrent();
    await worker.tick();
    await expect(
      service.confirm(original.userId, original.id),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(
      await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${original.requestId}::uuid`,
    ).toEqual([{ status: 'EXPIRED' }]);
    await enqueue(4, 2, new Date().toISOString());
    expect(
      (await offers()).find(({ status }) => status === 'OFFERED')?.requestId,
    ).toBe(uuid('a000', 2));
    await expireCurrent();
    await worker.tick();
    expect(
      (await offers()).find(({ status }) => status === 'OFFERED')?.requestId,
    ).toBe(uuid('a000', 3));
    await expireCurrent();
    await worker.tick();
    expect(
      (await offers()).find(({ status }) => status === 'OFFERED')?.requestId,
    ).toBe(uuid('a000', 4));
  });

  it('el alta directa no adelanta a quienes esperan en FIFO', async () => {
    const repository = new MentorsRepository(
      prisma as unknown as PrismaService,
    );
    await expect(
      repository.activate(
        uuid('8000', 3),
        mentorRoleId,
        [areaId],
        [orientationId],
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(
      await prisma.userRole.count({ where: { roleId: mentorRoleId } }),
    ).toBe(0);
    await service.reconcile();
    expect((await offers())[0].requestId).toBe(uuid('a000', 1));
  });

  it('no activa ni confirma parcialmente si la orientación deja de ser válida', async () => {
    await service.reconcile();
    const [offer] = await offers();
    await prisma.orientationType.update({
      where: { id: orientationId },
      data: { isActive: false },
    });
    await expect(service.confirm(offer.userId, offer.id)).rejects.toMatchObject(
      { statusCode: 400 },
    );
    expect((await offers())[0].status).toBe('OFFERED');
    expect(
      await prisma.userRole.count({ where: { roleId: mentorRoleId } }),
    ).toBe(0);
  });

  const exits = () =>
    new MentorExitRepository(prisma as unknown as PrismaService);
  async function activateFirst() {
    await service.reconcile();
    const [offer] = await offers();
    await service.confirm(offer.userId, offer.id);
    return offer;
  }
  async function appointment(mentorId: string, title: string, future = true) {
    const status = await prisma.appointmentStatus.upsert({
      where: { title },
      create: { title },
      update: {},
    });
    const startAt = new Date(Date.now() + (future ? 3_600_000 : -7_200_000));
    return prisma.appointment.create({
      data: {
        mentorId,
        studentId: uuid('8000', 3),
        statusId: status.id,
        startAt,
        endAt: new Date(startAt.getTime() + 1_800_000),
      },
    });
  }

  it.each(['PENDIENTE', 'CONFIRMADA'])(
    'rechaza la salida por una cita futura %s sin cambiar ningún estado',
    async (title) => {
      const offer = await activateFirst();
      await appointment(offer.userId, title);
      await expect(exits().leave(offer.userId)).rejects.toMatchObject({
        statusCode: 409,
        data: {
          code: 'MENTOR_HAS_FUTURE_APPOINTMENTS',
          agendaPath: '/mentor/availability',
        },
      });
      expect(
        await prisma.userRole.count({
          where: { roleId: mentorRoleId, deletedAt: null },
        }),
      ).toBe(1);
      expect(
        await prisma.user.findUnique({ where: { id: offer.userId } }),
      ).toMatchObject({ isAvailableForMentoring: true });
      expect(
        await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${offer.requestId}::uuid`,
      ).toEqual([{ status: 'ACTIVE' }]);
      expect(await offers()).toHaveLength(1);
    },
  );

  it('finaliza una sola vez bajo concurrencia y reasigna exactamente un cupo al siguiente FIFO', async () => {
    const offer = await activateFirst();
    await appointment(offer.userId, 'PENDIENTE', false);
    await appointment(offer.userId, 'CANCELADA');
    const results = await Promise.all([
      exits().leave(offer.userId),
      exits().leave(offer.userId),
    ]);
    expect(
      results
        .map(({ alreadyEnded }) => alreadyEnded)
        .sort((a, b) => Number(a) - Number(b)),
    ).toEqual([false, true]);
    await expect(exits().leave(offer.userId)).resolves.toMatchObject({
      status: 'ENDED',
      alreadyEnded: true,
    });
    expect(
      await prisma.userRole.count({
        where: { roleId: mentorRoleId, deletedAt: null },
      }),
    ).toBe(0);
    expect(
      await prisma.userRole.count({
        where: { roleId: mentorRoleId, deletedAt: { not: null } },
      }),
    ).toBe(1);
    expect(
      await prisma.user.findUnique({ where: { id: offer.userId } }),
    ).toMatchObject({ isAvailableForMentoring: false });
    expect(await prisma.mentorTechnicalArea.count()).toBe(1);
    expect(await prisma.mentorOrientationType.count()).toBe(1);
    expect(
      await new MentorsRepository(
        prisma as unknown as PrismaService,
      ).findMyParticipation(offer.userId),
    ).toMatchObject({
      status: 'DEACTIVATED',
      areas: [{ id: areaId }],
      orientations: [{ id: orientationId }],
    });
    expect(
      await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${offer.requestId}::uuid`,
    ).toEqual([{ status: 'ENDED' }]);
    expect(
      (await offers())
        .filter(({ status }) => status === 'OFFERED')
        .map(({ requestId }) => requestId),
    ).toEqual([uuid('a000', 2)]);
    expect(
      await new MentorsRepository(
        prisma as unknown as PrismaService,
      ).capacity(),
    ).toMatchObject({ activeMentors: 0, reservedOffers: 1, available: 0 });
    await expect(service.confirm(offer.userId, offer.id)).rejects.toMatchObject(
      { statusCode: 409 },
    );
  });

  it('al regresar conserva el historial, entra al final y revalida elegibilidad y capacidad', async () => {
    const original = await activateFirst();
    await exits().leave(original.userId);
    await enqueue(4, 2, new Date().toISOString());
    const repository = new MentorsRepository(
      prisma as unknown as PrismaService,
    );
    await expect(
      repository.activate(
        original.userId,
        mentorRoleId,
        [areaId],
        [orientationId],
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expireCurrent();
    await service.reconcile();
    expect(
      (await offers()).find(({ status }) => status === 'OFFERED')?.requestId,
    ).toBe(uuid('a000', 3));
    await prisma.user.update({
      where: { id: original.userId },
      data: { isActive: false },
    });
    await expireCurrent();
    await service.reconcile();
    expect(
      (await offers()).filter(({ status }) => status === 'OFFERED'),
    ).toHaveLength(0);
    await expect(
      repository.activate(
        original.userId,
        mentorRoleId,
        [areaId],
        [orientationId],
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
    await prisma.user.update({
      where: { id: original.userId },
      data: { isActive: true },
    });
    await service.reconcile();
    const returned = (await offers()).find(
      ({ status }) => status === 'OFFERED',
    )!;
    expect(returned.requestId).toBe(uuid('a000', 4));
    await service.confirm(original.userId, returned.id);
    expect(await repository.findMyParticipation(original.userId)).toMatchObject(
      {
        status: 'ACTIVE',
        areas: [{ id: areaId }],
        orientations: [{ id: orientationId }],
      },
    );
    expect(
      await prisma.userRole.count({
        where: { roleId: mentorRoleId, deletedAt: null },
      }),
    ).toBe(1);
  });

  it('la disponibilidad reversible conserva rol, participación y cupo', async () => {
    const offer = await activateFirst();
    const repository = new MentorsRepository(
      prisma as unknown as PrismaService,
    );
    await repository.updateAvailability(offer.userId, false);
    expect(await repository.capacity()).toMatchObject({
      activeMentors: 1,
      reservedOffers: 0,
      available: 0,
    });
    expect(
      await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${offer.requestId}::uuid`,
    ).toEqual([{ status: 'ACTIVE' }]);
    await repository.updateAvailability(offer.userId, true);
    expect(
      await prisma.userRole.count({
        where: { roleId: mentorRoleId, deletedAt: null },
      }),
    ).toBe(1);
  });

  it('revierte toda la salida si falla la reasignación del cupo', async () => {
    const offer = await activateFirst();
    await admin.query(`CREATE FUNCTION fail_offer() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Fallo de prueba al reasignar'; END $$`);
    await admin.query(`CREATE TRIGGER fail_offer BEFORE INSERT ON mentor_slot_offers
      FOR EACH ROW EXECUTE FUNCTION fail_offer()`);
    try {
      await expect(exits().leave(offer.userId)).rejects.toThrow();
    } finally {
      await admin.query('DROP TRIGGER fail_offer ON mentor_slot_offers');
      await admin.query('DROP FUNCTION fail_offer()');
    }
    expect(
      await prisma.userRole.count({
        where: { roleId: mentorRoleId, deletedAt: null },
      }),
    ).toBe(1);
    expect(
      await prisma.user.findUnique({ where: { id: offer.userId } }),
    ).toMatchObject({ isAvailableForMentoring: true });
    expect(await prisma.mentorTechnicalArea.count()).toBe(1);
    expect(
      await prisma.$queryRaw`SELECT status FROM mentor_participation_requests WHERE id = ${offer.requestId}::uuid`,
    ).toEqual([{ status: 'ACTIVE' }]);
    expect(await offers()).toHaveLength(1);
  });

  it('permite finalizar a un mentor previo a las solicitudes HU7 y no modifica usuarios sin rol', async () => {
    await prisma.$executeRaw`TRUNCATE mentor_slot_offers, mentor_participation_requests`;
    const userId = uuid('8000', 1);
    await prisma.userRole.create({ data: { userId, roleId: mentorRoleId } });
    await expect(exits().leave(userId)).resolves.toMatchObject({
      alreadyEnded: false,
    });
    await expect(exits().leave(uuid('8000', 3))).resolves.toMatchObject({
      alreadyEnded: true,
    });
    expect(
      await prisma.userRole.count({
        where: { roleId: mentorRoleId, deletedAt: null },
      }),
    ).toBe(0);
    expect(await offers()).toHaveLength(0);
  });
});
