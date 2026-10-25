import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient, type Prisma } from '../../../prisma/client.js';
import { buildDatabaseConnectionString } from '../../../common/prisma/build-connection-string.js';
import { SEED_PASSWORD } from '../../users/constants/seed-users.constants.js';

const id = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, '0')}`;
const MS_DAY = 24 * 60 * 60 * 1000;

async function seed(tx: Prisma.TransactionClient, password: string, now: Date) {
  const graduate = await tx.role.findUniqueOrThrow({ where: { name: 'titulado' } });
  const mentor = await tx.role.findUniqueOrThrow({ where: { name: 'mentor' } });
  const approved = await tx.accessRequestStatus.findUniqueOrThrow({ where: { title: 'approved' } });
  const career = await tx.career.findFirstOrThrow({ orderBy: { title: 'asc' } });
  const area = await tx.technicalArea.findFirstOrThrow({ orderBy: { name: 'asc' } });
  const orientation = await tx.orientationType.findFirstOrThrow({ where: { isActive: true }, orderBy: { name: 'asc' } });

  const accounts = [
    'mentor.a@umssy.test', 'mentor.b@umssy.test', 'multi.role@umssy.test',
    ...Array.from({ length: 22 }, (_, index) => `hu7.${String(index + 1).padStart(2, '0')}@umssy.test`),
  ];
  for (const [index, email] of accounts.entries()) {
    const number = index + 1;
    const user = await tx.user.upsert({ where: { email }, update: {}, create: {
      id: id(1000 + number), firstName: 'Demo HU7', lastName: String(number).padStart(2, '0'),
      email, password, isActive: true,
    } });
    if (!await tx.userRole.findFirst({ where: { userId: user.id, roleId: graduate.id, deletedAt: null } })) {
      await tx.userRole.create({ data: { userId: user.id, roleId: graduate.id } });
    }
    if (!await tx.accessRequest.findUnique({ where: { approvedUserId: user.id } })) {
      await tx.accessRequest.create({ data: {
        id: id(2000 + number), approvedUserId: user.id, firstName: user.firstName,
        lastName: user.lastName, email, idCardNumber: `HU7CI${String(number).padStart(5, '0')}`,
        idCardIssuedIn: 'CB', sisCode: `HU7SIS${String(number).padStart(5, '0')}`,
        birthDate: new Date('1995-01-01'), graduationYear: 2020, careerId: career.id,
        statusId: approved.id, submittedAt: new Date(now.getTime() - 10 * MS_DAY),
        reviewedAt: new Date(now.getTime() - 9 * MS_DAY),
      } });
    }
    // Six additional mentors give nine active mentors together with the three existing fixtures.
    if (number >= 4 && number <= 9) {
      if (!await tx.userRole.findFirst({ where: { userId: user.id, roleId: mentor.id, deletedAt: null } })) {
        await tx.userRole.create({ data: { userId: user.id, roleId: mentor.id } });
      }
      await tx.mentorTechnicalArea.createMany({ data: [{ mentorId: user.id, technicalAreaId: area.id }], skipDuplicates: true });
      await tx.mentorOrientationType.createMany({ data: [{ mentorId: user.id, orientationTypeId: orientation.id }], skipDuplicates: true });
      if (!await tx.mentorParticipationRequest.findUnique({ where: { id: id(3000 + number) } })) {
        await tx.mentorParticipationRequest.create({ data: {
          id: id(3000 + number), userId: user.id, status: 'ACTIVE', requestedAt: new Date(now.getTime() - 5 * MS_DAY),
          activatedAt: new Date(now.getTime() - 5 * MS_DAY),
          technicalAreas: { create: [{ technicalAreaId: area.id }] },
          orientationTypes: { create: [{ orientationTypeId: orientation.id }] },
        } });
      }
    }
  }

  const unapprovedEmail = 'hu7.no-aprobado@umssy.test';
  const unapproved = await tx.user.upsert({ where: { email: unapprovedEmail }, update: {}, create: {
    id: id(1999), firstName: 'Demo HU7', lastName: 'Sin aprobación', email: unapprovedEmail, password,
  } });
  if (!await tx.userRole.findFirst({ where: { userId: unapproved.id, roleId: graduate.id, deletedAt: null } })) {
    await tx.userRole.create({ data: { userId: unapproved.id, roleId: graduate.id } });
  }

  const account = async (number: number) => tx.user.findUniqueOrThrow({ where: { email: accounts[number - 1] } });
  const request = async (number: number, status: string, requestedAt: Date, requestId = id(3000 + number)) => {
    const user = await account(number);
    if (!await tx.mentorParticipationRequest.findUnique({ where: { id: requestId } })) {
      await tx.mentorParticipationRequest.create({ data: {
        id: requestId, userId: user.id, status, requestedAt,
        queuedAt: status === 'ACTIVE' ? null : requestedAt,
        cancelledAt: status === 'CANCELLED' ? new Date(requestedAt.getTime() + 60_000) : null,
        technicalAreas: { create: [{ technicalAreaId: area.id }] },
        orientationTypes: { create: [{ orientationTypeId: orientation.id }] },
      } });
    }
    return { user, requestId };
  };
  const offeredAt = new Date(now.getTime() - 60 * 60_000);
  const offered = await request(10, 'OFFERED', new Date(now.getTime() - 3 * MS_DAY));
  if (!await tx.mentorSlotOffer.findUnique({ where: { id: id(4001) } })) {
    await tx.mentorSlotOffer.create({ data: { id: id(4001), requestId: offered.requestId, status: 'OFFERED', offeredAt,
      expiresAt: new Date(offeredAt.getTime() + MS_DAY) } });
  }
  for (const [number, days] of [[11, 2], [12, 1], [13, 0]] as const) {
    await request(number, 'PENDING', new Date(now.getTime() - days * MS_DAY - 5 * 60_000), number === 13 ? id(3033) : undefined);
  }
  const expired = await request(13, 'EXPIRED', new Date(now.getTime() - 6 * MS_DAY), id(3032));
  if (!await tx.mentorSlotOffer.findUnique({ where: { id: id(4002) } })) {
    const pastOffered = new Date(now.getTime() - 3 * MS_DAY);
    await tx.mentorSlotOffer.create({ data: { id: id(4002), requestId: expired.requestId, status: 'EXPIRED',
      offeredAt: pastOffered, expiresAt: new Date(pastOffered.getTime() + MS_DAY), expiredAt: new Date(pastOffered.getTime() + MS_DAY) } });
  }
  await request(14, 'CANCELLED', new Date(now.getTime() - 4 * MS_DAY));
  const expiredOnly = await request(16, 'EXPIRED', new Date(now.getTime() - 5 * MS_DAY));
  if (!await tx.mentorSlotOffer.findUnique({ where: { id: id(4003) } })) {
    const pastOffered = new Date(now.getTime() - 2 * MS_DAY);
    await tx.mentorSlotOffer.create({ data: { id: id(4003), requestId: expiredOnly.requestId, status: 'EXPIRED',
      offeredAt: pastOffered, expiresAt: new Date(pastOffered.getTime() + MS_DAY), expiredAt: new Date(pastOffered.getTime() + MS_DAY) } });
  }

  for (const event of [
    { requestId: offered.requestId, recipient: offered.user.email, type: 'OFFERED' },
    { requestId: id(3011), recipient: (await account(11)).email, type: 'WAITING' },
  ]) {
    await tx.mentorEmailOutbox.upsert({ where: { eventKey: `${event.requestId}:${event.type}` },
      update: {}, create: { ...event, eventKey: `${event.requestId}:${event.type}` } });
  }

  // Cuentas aisladas para los tres estados del control de abuso. Repetir el seed
  // actualiza solo estos ejemplos y no altera las solicitudes de otros usuarios.
  for (const scenario of [
    { number: 21, attempts: 5, hoursAgo: 0, sanction: 'ACTIVE' },
    { number: 22, attempts: 4, hoursAgo: 0, sanction: null },
    { number: 23, attempts: 5, hoursAgo: 120, sanction: 'EXPIRED' },
  ] as const) {
    const user = await account(scenario.number);
    const anchor = new Date(now.getTime() - scenario.hoursAgo * 3_600_000);
    for (let index = 0; index < scenario.attempts; index += 1) {
      const attemptId = id(5000 + scenario.number * 10 + index);
      await tx.mentorParticipationAttempt.upsert({ where: { id: attemptId }, update: {
        occurredAt: new Date(anchor.getTime() - (scenario.attempts - index) * 60_000),
      }, create: { id: attemptId, userId: user.id, idempotencyKey: id(6000 + scenario.number * 10 + index),
        payloadHash: 'seed', action: 'REQUEST', outcome: index === 4 ? 'SANCTIONED' : 'NO_SLOTS',
        counted: true, statusCode: index === 4 ? 429 : 409,
        detail: index === 4 ? 'Las nuevas solicitudes están suspendidas' : 'No hay cupos disponibles',
        response: { code: index === 4 ? 'MENTOR_REQUEST_SUSPENDED' : 'NO_SLOTS' },
        occurredAt: new Date(anchor.getTime() - (scenario.attempts - index) * 60_000),
      } });
    }
    if (scenario.sanction) {
      const sanctionId = id(7000 + scenario.number);
      const expiresAt = new Date(anchor.getTime() + 72 * 3_600_000);
      await tx.mentorParticipationSanction.upsert({ where: { id: sanctionId }, update: {
        startsAt: anchor, expiresAt,
      }, create: { id: sanctionId, userId: user.id, reason: 'FIVE_ATTEMPTS_IN_24_HOURS',
        startsAt: anchor, expiresAt } });
      if (scenario.sanction === 'ACTIVE') {
        await tx.mentorEmailOutbox.upsert({ where: { eventKey: `sanction:${sanctionId}` }, update: {}, create: {
          eventKey: `sanction:${sanctionId}`, recipient: user.email, type: 'SANCTION',
          payload: { startsAt: anchor.toISOString(), expiresAt: expiresAt.toISOString() },
        } });
      }
    }
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Fixtures HU7 prohibidos en producción');
  if (!['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST ?? '')) {
    throw new Error('El seed HU7 solo admite PostgreSQL local');
  }
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: buildDatabaseConnectionString(), options: '-c TimeZone=UTC' },
    process.env.DB_SCHEMA ? { schema: process.env.DB_SCHEMA } : undefined) });
  try {
    const password = await bcrypt.hash(SEED_PASSWORD, 10);
    await client.$transaction((tx) => seed(tx, password, new Date()), { maxWait: 10_000, timeout: 120_000 });
    const approvedGraduates = await client.user.count({ where: { isActive: true,
      roles: { some: { deletedAt: null, role: { name: 'titulado' } } },
      approvedAccessRequest: { is: { status: { title: 'approved' } } },
    } });
    const activeMentors = await client.user.count({ where: { roles: { some: { deletedAt: null, role: { name: 'mentor' } } } } });
    const reservedOffers = await client.mentorSlotOffer.count({ where: { status: 'OFFERED', expiresAt: { gt: new Date() } } });
    const capacity = Math.floor(approvedGraduates * .4);
    process.stdout.write(`HU7 local: aprobados=${approvedGraduates}, capacidad=${capacity}, mentores=${activeMentors}, reservas=${reservedOffers}, disponibles=${Math.max(0, capacity - activeMentors - reservedOffers)}\n`);
  } finally { await client.$disconnect(); }
}

void main().catch((error: unknown) => { process.stderr.write(String(error)); process.exitCode = 1; });
