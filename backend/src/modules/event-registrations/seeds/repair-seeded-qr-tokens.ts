import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createSeedClient } from '../../../common/database/seed-client.js';
import type { Prisma } from '../../../prisma/client.js';

export async function repairSeededQrTokens(
  tx: Pick<Prisma.TransactionClient, 'eventRegistration'>,
): Promise<number> {
  const registrations = await tx.eventRegistration.findMany({
    where: { OR: [{ qrToken: { startsWith: 'qr-seed-' } }, { qrToken: { startsWith: 'seed-' } }] },
    select: { id: true, qrToken: true },
  });
  let repaired = 0;
  for (const registration of registrations) {
    const result = await tx.eventRegistration.updateMany({
      where: { id: registration.id, qrToken: registration.qrToken },
      data: { qrToken: randomBytes(32).toString('hex') },
    });
    repaired += result.count;
  }
  return repaired;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prisma = createSeedClient();
  try {
    console.log('Tokens QR de prueba reparados:', await repairSeededQrTokens(prisma));
  } catch (error: unknown) {
    console.error('No se pudieron reparar los tokens QR:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
