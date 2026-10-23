import 'dotenv/config';

import { pathToFileURL } from 'node:url';

import { Logger } from '@nestjs/common';

import { seedEvents } from '../../modules/events/seeds/events.seed.js';
import { seedEventRegistrations } from '../../modules/event-registrations/seeds/event-registrations.seed.js';
import { seedAccessRequests } from '../../modules/access-requests/seeds/access-requests.seed.js';
import { seedAvailability } from '../../modules/availability/seeds/availability.seed.js';
import { seedJobOffers } from '../../modules/job-offers/seeds/job-offers.seed.js';
import { seedOrientationTypes } from '../../modules/orientation-types/seeds/orientation-types.seed.js';
import { seedTechnicalAreas } from '../../modules/technical-areas/seeds/technical-areas.seed.js';
import { seedChat } from '../../modules/chat/seeds/chat.seed.js';
import { SEED_USERS } from '../../modules/users/constants/seed-users.constants.js';
import {
  hashSeedPassword,
  seedUsers,
} from '../../modules/users/seeds/users.seed.js';
import type { PrismaClient, Prisma } from '../../prisma/client.js';
import type { SeedSummary } from '../types/seed-summary.types.js';
import { createSeedClient } from './seed-client.js';
import { SeedOptionsSchema } from './seed-options.schema.js';
import { runSeedStage } from './run-seed-stage.js';

export { createSeedClient, loadSeedEnv } from './seed-client.js';

export async function runSeed(client?: PrismaClient): Promise<SeedSummary> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Los datos de demostración no se pueden cargar en producción',
    );
  }
  const options = SeedOptionsSchema.safeParse(process.env);
  if (!options.success) {
    throw new Error(
      'SEED_TRANSACTION_TIMEOUT_MS debe ser un entero entre 1 y 600000 milisegundos',
    );
  }
  const ownsClient = client === undefined;
  const prisma = client ?? createSeedClient();

  try {
    const now = new Date();
    const password = await runSeedStage(
      'contraseña de prueba',
      hashSeedPassword,
    );

    const runModule = <T>(
      name: string,
      operation: (tx: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> =>
      runSeedStage(name, () =>
        prisma.$transaction(operation, {
          maxWait: 5_000,
          timeout: options.data.SEED_TRANSACTION_TIMEOUT_MS,
        }),
      );
    await runModule('áreas técnicas', seedTechnicalAreas);
    await runModule('tipos de orientación', seedOrientationTypes);
    await runModule('catálogos de vacantes', seedJobOffers);

    const usersResult = await runModule('usuarios y roles', (tx) =>
      seedUsers(tx, password),
    );
    const { users } = usersResult;
    await runModule('eventos', (tx) => seedEvents(tx, users.eventGraduate.id));
    await runModule('inscripciones', (tx) =>
      seedEventRegistrations(tx, users.eventGraduate.id),
    );
    const availabilityResult = await runModule('disponibilidad', (tx) =>
      seedAvailability(
        tx,
        {
          mentorId: users.mentorA.id,
          graduateId: users.graduate.id,
          ownedUserIds: Object.values(users).map((user) => user.id),
        },
        now,
      ),
    );

    const accessRequestsResult = await runModule(
      'catálogos de solicitudes',
      seedAccessRequests,
    );
    await runModule('chat', seedChat);

    return {
      weeks: availabilityResult.weeks,
      plan: availabilityResult.plan,
      roles: usersResult.roles,
      statuses: availabilityResult.statuses,
      users: SEED_USERS.length,
      userRoles: usersResult.userRoles,
      blocks: availabilityResult.blocks,
      appointments: availabilityResult.appointments,
      legacyRoles: usersResult.legacyRoles,
      warnings: availabilityResult.warnings,
      accessRequests: accessRequestsResult,
    };
  } finally {
    if (ownsClient) {
      await prisma.$disconnect();
    }
  }
}

async function main(): Promise<void> {
  const logger = new Logger('Seed');
  let client: PrismaClient | undefined;

  try {
    client = createSeedClient();
    const summary = await runSeed(client);
    logger.log(
      `Seed completado — roles: ${summary.roles}, estados: ${summary.statuses}, usuarios: ${summary.users}, ` +
        `roles de usuario nuevos: ${summary.userRoles}, bloques: ${summary.blocks}, citas: ${summary.appointments}, ` +
        `solicitudes (estados: ${summary.accessRequests.statuses}, tipos de documento: ${summary.accessRequests.documentTypes}, carreras: ${summary.accessRequests.careers})` +
        (summary.legacyRoles > 0
          ? ` (roles en mayúscula eliminados: ${summary.legacyRoles})`
          : ''),
    );
    for (const warning of summary.warnings) {
      logger.warn(warning);
    }
  } catch (error) {
    logger.error(
      'El seed se detuvo; los módulos confirmados anteriormente se conservan',
      error instanceof Error ? error.stack : String(error),
    );
    process.exitCode = 1;
  } finally {
    await client?.$disconnect();
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  void main();
}
