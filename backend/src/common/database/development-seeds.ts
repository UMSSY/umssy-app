import { FIXTURE_USERS } from '../../modules/users/constants/seed-fixture-users.constants.js';
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import type { PrismaClient } from '../../prisma/client.js';
import { createSeedClient } from './seed-client.js';
import { runSeed } from './seeds.js';
import { FixtureContext } from './fixture-context.js';
import { seedFixtureStages } from './fixture-stages.js';
import { loadFixtureReferences } from './fixture-references.js';
import { seedRequiredCatalogs } from './required-catalogs.js';
import { SeedOptionsSchema } from './seed-options.schema.js';

export async function runDevelopmentFixtures(
  client?: PrismaClient,
): Promise<Record<string, number>> {
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'Los datos de demostración no se pueden cargar en producción',
    );
  const options = SeedOptionsSchema.parse(process.env);
  const prisma = client ?? createSeedClient();
  try {
    return await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(762614001)`;
        const admin = await tx.user.findUniqueOrThrow({
          where: { email: 'admin.1@umssy.test' },
          select: { id: true },
        });
        const initial = new FixtureContext(new Date(), admin.id);
        const existing = await tx.user.findUnique({
          where: { id: initial.getId(FIXTURE_USERS[0].key) },
          select: { createdAt: true },
        });
        const context = new FixtureContext(
          existing?.createdAt ?? initial.anchor,
          admin.id,
        );
        await seedRequiredCatalogs(tx);
        await loadFixtureReferences(tx, context);
        return seedFixtureStages(tx, context);
      },
      { maxWait: 5_000, timeout: options.SEED_TRANSACTION_TIMEOUT_MS },
    );
  } finally {
    if (!client) await prisma.$disconnect();
  }
}

export async function runDevelopmentSeed(): Promise<void> {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Use seed:production para inicializar producción');
  await runSeed();
  const counts = await runDevelopmentFixtures();
  console.log('Datos de demostración completados:', counts);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runDevelopmentSeed().catch((error: unknown) => {
    console.error(
      'El seed de desarrollo se detuvo:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  });
}
