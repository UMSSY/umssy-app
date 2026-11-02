import type { Prisma } from '../../../prisma/client.js';

export async function seedAttachmentTypesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.attachmentType.createMany({
    data: [
      { title: 'IMAGE', description: 'Imagen' },
      { title: 'PDF', description: 'Documento PDF' },
      { title: 'LINK', description: 'Enlace' },
    ],
    skipDuplicates: true,
  });
}