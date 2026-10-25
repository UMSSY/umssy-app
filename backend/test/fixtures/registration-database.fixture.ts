import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/prisma/client.js';
import { buildDatabaseConnectionString } from '../../src/common/prisma/build-connection-string.js';

export async function createRegistrationDatabaseFixture() {
  const database = process.env.REGISTRATIONS_E2E_DATABASE;
  if (!database?.endsWith('_test') || process.env.DB_NAME !== database || !['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST ?? '')) {
    throw new Error('Registration fixtures require a dedicated local database ending in _test');
  }
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: buildDatabaseConnectionString(), max: 5 }) });
  await client.$connect();
  const [identity] = await client.$queryRaw<Array<{ database: string }>>`SELECT current_database() AS database`;
  if (identity.database !== database) {
    await client.$disconnect();
    throw new Error('Unexpected fixture database');
  }
  const suffix = randomUUID();
  const role = await client.role.upsert({ where: { name: 'titulado' }, update: {}, create: { name: 'titulado' } });
  const users = await Promise.all([0, 1].map((index) => client.user.create({
    data: {
      firstName: 'Registration', lastName: 'Fixture', email: `registration-${suffix}-${index}@example.test`,
      roles: { create: { roleId: role.id } },
    },
  })));
  const category = await client.eventCategory.create({ data: { name: `Fixture ${suffix}` } });
  const modality = await client.eventModality.create({ data: { title: `Fixture ${suffix}` } });
  const origin = await client.eventOrigin.create({ data: { title: `Fixture ${suffix}` } });
  const status = await client.eventStatus.upsert({ where: { title: 'Publicado' }, update: {}, create: { title: 'Publicado' } });
  for (const title of ['Confirmada', 'Cancelada']) {
    await client.registrationStatus.upsert({ where: { title }, update: {}, create: { title } });
  }
  const eventIds: string[] = [];
  return {
    client,
    users,
    async createEvent(capacity: number | null = 1) {
      const event = await client.event.create({ data: {
        title: `Registration fixture ${suffix}`,
        eventDate: new Date(Date.now() + 3 * 86_400_000),
        startTime: new Date('1970-01-01T09:00:00Z'), endTime: new Date('1970-01-01T12:00:00Z'),
        capacity, categoryId: category.id, modalityId: modality.id, originId: origin.id,
        statusId: status.id, createdById: users[0].id,
      } });
      eventIds.push(event.id);
      return event;
    },
    async cleanup() {
      try {
        await client.event.deleteMany({ where: { id: { in: eventIds } } });
        await client.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
        await client.eventCategory.delete({ where: { id: category.id } });
        await client.eventModality.delete({ where: { id: modality.id } });
        await client.eventOrigin.delete({ where: { id: origin.id } });
      } finally {
        await client.$disconnect();
      }
    },
  };
}
