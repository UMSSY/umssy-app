import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/client.js';
import { buildDatabaseConnectionString } from '../prisma/build-connection-string.js';
import type { SeedEnv } from '../types/seed-env.types.js';
import { SeedEnvSchema } from './seed-env.schema.js';

export function loadSeedEnv(source: NodeJS.ProcessEnv = process.env): SeedEnv {
  const parsed = SeedEnvSchema.safeParse(source);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(raíz)'}: ${issue.message}`)
      .join(' | ');
    throw new Error(`Configuración de base de datos inválida — ${detail}`);
  }
  return parsed.data;
}

export function createSeedClient(env: SeedEnv = loadSeedEnv()): PrismaClient {
  const adapter = new PrismaPg(
    { connectionString: buildDatabaseConnectionString() },
    env.DB_SCHEMA ? { schema: env.DB_SCHEMA } : undefined,
  );
  return new PrismaClient({ adapter });
}
