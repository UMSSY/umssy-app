import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import type { PrismaClient } from '../../prisma/client.js';
import { createSeedClient } from './seed-client.js';
import { seedRequiredCatalogs } from './required-catalogs.js';
import { SeedOptionsSchema } from './seed-options.schema.js';

export async function runCatalogSeed(client?: PrismaClient): Promise<void> {
  const options = SeedOptionsSchema.parse(process.env);
  const prisma = client ?? createSeedClient();
  try {
    await prisma.$transaction(
      async (tx) => {
        // Share the lock with administrator initialization.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(762614002)`;
        await seedRequiredCatalogs(tx);
      },
      { maxWait: 5_000, timeout: options.SEED_TRANSACTION_TIMEOUT_MS },
    );
  } finally {
    if (!client) await prisma.$disconnect();
  }
}

export async function runCatalogSeedCli(
  args: string[] = process.argv.slice(2),
): Promise<void> {
  if (args.length) {
    console.error(
      'Uso: pnpm run seed:production (solo catálogos). Para crear un administrador use seed:admin --email correo@dominio.bo',
    );
    process.exitCode = 1;
    return;
  }
  try {
    await runCatalogSeed();
    console.log('Catálogos cargados. No se crearon usuarios.');
  } catch (error) {
    console.error(
      'No se pudieron cargar los catálogos:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  void runCatalogSeedCli();
