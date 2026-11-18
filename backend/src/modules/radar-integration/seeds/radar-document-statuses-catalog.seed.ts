import type { Prisma } from '../../../prisma/client.js';
import { RADAR_DOCUMENT_STATUSES } from '../constants/radar-document-statuses.constants.js';
export async function seedRadarDocumentStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.radarDocumentStatus.createMany({
    data: [...RADAR_DOCUMENT_STATUSES],
    skipDuplicates: true,
  });
}
