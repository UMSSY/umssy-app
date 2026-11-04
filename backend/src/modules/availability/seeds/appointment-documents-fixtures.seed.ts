import type { Prisma } from '../../../prisma/client.js';

export async function seedAppointmentDocumentFixture(
  tx: Prisma.TransactionClient,
  appointmentId: string,
): Promise<void> {
  const data = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
    'base64',
  );
  await tx.appointmentDocument.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      fileName: 'documento-ejemplo.png',
      mimeType: 'image/png',
      sizeBytes: data.length,
      data,
    },
    update: {},
  });
}
