import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { EventsService } from '../src/modules/events/services/events.service.js';
import { EventRegistrationsService } from '../src/modules/event-registrations/services/event-registrations.service.js';

describe('event registration concurrency (PostgreSQL)', () => {
  const prisma = new PrismaService();
  const eventsService = new EventsService(prisma);
  const registrationsService = new EventRegistrationsService(prisma, eventsService);
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const eventIds: string[] = [];
  const userIds: string[] = [];
  let categoryId: string;
  let modalityId: string;
  let originId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const [category, modality, origin, publishedStatus, confirmedStatus] = await Promise.all([
      prisma.eventCategory.create({ data: { name: `Concurrency ${suffix}` } }),
      prisma.eventModality.create({ data: { title: `Concurrency ${suffix}` } }),
      prisma.eventOrigin.create({ data: { title: `Concurrency ${suffix}` } }),
      prisma.eventStatus.upsert({ where: { title: 'Publicado' }, update: {}, create: { title: 'Publicado' } }),
      prisma.registrationStatus.upsert({ where: { title: 'Confirmada' }, update: {}, create: { title: 'Confirmada' } }),
    ]);
    categoryId = category.id;
    modalityId = modality.id;
    originId = origin.id;

    const users = await Promise.all([0, 1].map((index) => prisma.user.create({
      data: {
        firstName: 'Concurrency',
        lastName: `Participant ${index}`,
        email: `registration-${suffix}-${index}@example.test`,
      },
    })));
    userIds.push(...users.map(({ id }) => id));

    for (let index = 0; index < 4; index += 1) {
      const event = await prisma.event.create({
        data: {
          title: `Concurrency ${suffix} ${index}`,
          eventDate: new Date('2999-01-01T00:00:00.000Z'),
          startTime: new Date('1970-01-01T10:00:00.000Z'),
          endTime: new Date('1970-01-01T11:00:00.000Z'),
          capacity: index === 3 ? 5 : 1,
          supportThreshold: 0,
          categoryId,
          modalityId,
          originId,
          statusId: publishedStatus.id,
          createdById: users[0].id,
        },
      });
      eventIds.push(event.id);
    }

    expect(confirmedStatus.title).toBe('Confirmada');
  });

  afterAll(async () => {
    if (eventIds.length > 0) {
      await prisma.eventRegistration.deleteMany({ where: { eventId: { in: eventIds } } });
      await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
    }
    if (userIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    if (categoryId) await prisma.eventCategory.deleteMany({ where: { id: categoryId } });
    if (modalityId) await prisma.eventModality.deleteMany({ where: { id: modalityId } });
    if (originId) await prisma.eventOrigin.deleteMany({ where: { id: originId } });
    await prisma.$disconnect();
  });

  it('confirms only one of two concurrent requests for the final seat', async () => {
    for (const eventId of eventIds.slice(0, 3)) {
      const results = await Promise.allSettled([
        registrationsService.create(eventId, userIds[0]),
        registrationsService.create(eventId, userIds[1]),
      ]);
      const confirmed = results.filter((result) => result.status === 'fulfilled');
      const rejected = results.filter((result) => result.status === 'rejected');

      expect(confirmed).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]).toMatchObject({ reason: { code: 'EVENT_FULL' } });
      await expect(prisma.eventRegistration.count({
        where: {
          eventId,
          cancelledAt: null,
          status: { title: 'Confirmada' },
        },
      })).resolves.toBe(1);
    }
  });

  it('keeps one row and its pass when the same user retries concurrently', async () => {
    const eventId = eventIds[3];
    const results = await Promise.allSettled([
      registrationsService.create(eventId, userIds[0]),
      registrationsService.create(eventId, userIds[0]),
    ]);
    const confirmed = results.filter((result) => result.status === 'fulfilled');

    expect(confirmed).toHaveLength(2);
    expect(confirmed[0]).toMatchObject({ status: 'fulfilled' });
    expect(confirmed[1]).toMatchObject({ status: 'fulfilled' });

    const registration = await prisma.eventRegistration.findUniqueOrThrow({
      where: { eventId_userId: { eventId, userId: userIds[0] } },
      select: { id: true, qrToken: true },
    });
    expect(confirmed[0]).toMatchObject({ value: { id: registration.id, qrToken: registration.qrToken } });
    expect(confirmed[1]).toMatchObject({ value: { id: registration.id, qrToken: registration.qrToken } });
    await expect(prisma.eventRegistration.count({ where: { eventId, userId: userIds[0] } })).resolves.toBe(1);
    await expect(registrationsService.getPassById(registration.id, userIds[0])).resolves.toMatchObject({
      id: registration.id,
      qrToken: registration.qrToken,
    });
  });
});