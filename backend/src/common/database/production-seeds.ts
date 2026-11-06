import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import type { PrismaClient } from '../../prisma/client.js';
import { seedProductionAdmin } from '../../modules/users/seeds/production-admin.seed.js';
import type { ProductionSeedResponse } from '../types/production-seed-response.types.js';
import { createSeedClient } from './seed-client.js';
import { seedRequiredCatalogs } from './required-catalogs.js';
import { SeedOptionsSchema } from './seed-options.schema.js';
import { ProductionSeedOptionsSchema } from './production-seed-options.schema.js';

export async function runProductionSeed(
  email: string,
  client?: PrismaClient,
): Promise<ProductionSeedResponse> {
  const [, validatedEmail] = ProductionSeedOptionsSchema.parse([
    '--email',
    email,
  ]);
  const options = SeedOptionsSchema.parse(process.env);
  const prisma = client ?? createSeedClient();
  try {
    return await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(762614002)`;
        await seedRequiredCatalogs(tx);
        return seedProductionAdmin(tx, validatedEmail);
      },
      { maxWait: 5_000, timeout: options.SEED_TRANSACTION_TIMEOUT_MS },
    );
  } finally {
    if (!client) await prisma.$disconnect();
  }
}

export async function runProductionSeedCli(
  args: string[] = process.argv.slice(2),
): Promise<void> {
  const parsed = ProductionSeedOptionsSchema.safeParse(args);
  if (!parsed.success) {
    console.error('Uso: pnpm run seed:admin --email administrador@dominio.bo');
    process.exitCode = 1;
    return;
  }
  try {
    const result = await runProductionSeed(parsed.data[1]);
    console.log(
      `Inicialización de producción completada. Correo: ${result.email}`,
    );
    console.log(
      result.isCreated
        ? `Contraseña: ${result.password}`
        : 'El administrador ya existe; su contraseña se conserva.',
    );
  } catch (error) {
    console.error(
      'No se pudo inicializar producción:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  void runProductionSeedCli();
