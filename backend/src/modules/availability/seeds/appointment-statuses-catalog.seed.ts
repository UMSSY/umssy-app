import type { Prisma } from '../../../prisma/client.js';

export async function seedAppointmentStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.appointmentStatus.createMany({
    data: [
      { title: 'PENDIENTE' },
      { title: 'CONFIRMADA' },
      { title: 'COMPLETADA' },
      { title: 'CANCELADA' },
      { title: 'RECHAZADA' },
    ],
    skipDuplicates: true,
  });
}
