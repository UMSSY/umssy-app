// Base local exclusiva de esta prueba, con migraciones aplicadas:
// pnpm exec tsx src/modules/mentors/seeds/mentor-capacity.seed.ts [--full]
import { pathToFileURL } from 'node:url';
import { createSeedClient, loadSeedEnv } from '../../../common/database/seed-client.js';
import { hashSeedPassword } from '../../users/seeds/users.seed.js';
import { readMentorCapacity } from '../repositories/mentor-capacity.queries.js';

async function main() {
  const env = loadSeedEnv();
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '::1'].includes(env.DB_HOST)) {
    throw new Error('Esta semilla solo puede ejecutarse en una base local de pruebas');
  }
  const client = createSeedClient(env);
  try {
    if (await client.user.count({ where: { NOT: { email: { endsWith: '@hu7-capacity.test' } } } })) {
      throw new Error('Usa una base o esquema exclusivo: existen usuarios ajenos a esta semilla');
    }
    const password = await hashSeedPassword();
    const capacity = await client.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
      await tx.$queryRaw`SELECT set_config('search_path', quote_ident(${env.DB_SCHEMA ?? 'public'}), true)`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(1436)::text`;
      const graduate = await tx.role.upsert({ where: { name: 'titulado' }, update: {}, create: { name: 'titulado' } });
      const status = await tx.accessRequestStatus.upsert({ where: { title: 'approved' }, update: {}, create: { title: 'approved' } });
      const career = await tx.career.upsert({ where: { title: 'HU7 local' }, update: {}, create: { title: 'HU7 local' } });
      for (let number = 1; number <= 3; number += 1) {
        const id = `14360000-0000-4000-8000-${String(number).padStart(12, '0')}`;
        const requestId = `14360000-0000-4000-9000-${String(number).padStart(12, '0')}`;
        const email = `titulado${number}@hu7-capacity.test`;
        await tx.user.upsert({ where: { id }, update: { isActive: true }, create: {
          id, firstName: 'Titulado HU7', lastName: String(number), email, password,
        } });
        if (!await tx.userRole.findFirst({ where: { userId: id, roleId: graduate.id, deletedAt: null } })) {
          await tx.userRole.create({ data: { userId: id, roleId: graduate.id } });
        }
        await tx.userRole.deleteMany({ where: { userId: id, role: { name: 'mentor' } } });
        await tx.accessRequest.upsert({ where: { id: requestId }, update: { statusId: status.id }, create: {
          id: requestId, firstName: 'Titulado HU7', lastName: String(number), email,
          idCardNumber: `1436000${number}`, idCardIssuedIn: 'CB', sisCode: `14360000${number}`,
          birthDate: new Date('1990-01-01T00:00:00Z'), graduationYear: 2025,
          careerId: career.id, statusId: status.id,
        } });
        await tx.$executeRaw`UPDATE access_requests SET approved_user_id = ${id}::uuid WHERE id = ${requestId}::uuid`;
      }
      const offerId = '14360000-0000-4000-a000-000000000001';
      await tx.$executeRaw`DELETE FROM mentor_slot_offers WHERE id = ${offerId}::uuid`;
      if (process.argv.includes('--full')) {
        await tx.$executeRaw`
          INSERT INTO mentor_slot_offers (id, user_id, offered_at, expires_at)
          VALUES (${offerId}::uuid, '14360000-0000-4000-8000-000000000001'::uuid,
            clock_timestamp(), clock_timestamp() + interval '24 hours')`;
      }
      return readMentorCapacity(tx);
    });
    process.stdout.write(`${JSON.stringify(capacity)}\n`);
  } finally {
    await client.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => { process.stderr.write(`${String(error)}\n`); process.exitCode = 1; });
}
