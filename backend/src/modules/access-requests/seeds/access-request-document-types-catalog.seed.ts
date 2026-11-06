import type { Prisma } from '../../../prisma/client.js';

export async function seedAccessRequestDocumentTypesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.accessRequestDocumentType.createMany({
    data: [{ title: 'academic_diploma' }, { title: 'national_title' }],
    skipDuplicates: true,
  });
}
