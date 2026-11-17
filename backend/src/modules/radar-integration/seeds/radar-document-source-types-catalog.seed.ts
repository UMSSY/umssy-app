import type { Prisma } from '../../../prisma/client.js';
import { RADAR_DOCUMENT_SOURCE_TYPES } from '../constants/radar-document-source-types.constants.js';
export async function seedRadarDocumentSourceTypesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.radarDocumentSourceType.createMany({
    data: [...RADAR_DOCUMENT_SOURCE_TYPES],
    skipDuplicates: true,
  });
}
