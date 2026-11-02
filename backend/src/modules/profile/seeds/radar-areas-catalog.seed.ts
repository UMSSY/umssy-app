import type { Prisma } from '../../../prisma/client.js';
import { RADAR_AREAS } from '../constants/radar-areas.constants.js';

export async function seedRadarAreasCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.radarArea.createMany({
    data: RADAR_AREAS.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
    })),
    skipDuplicates: true,
  });
}
