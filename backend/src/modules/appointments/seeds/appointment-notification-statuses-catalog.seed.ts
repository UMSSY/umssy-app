import type { Prisma } from '../../../prisma/client.js';
import { AppointmentNotificationStatus } from '../enums/appointment-notification-status.enum.js';

export async function seedAppointmentNotificationStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.appointmentNotificationStatus.createMany({
    data: [
      {
        title: AppointmentNotificationStatus.PENDING,
        description: 'Pendiente de envío o de reintento',
      },
      {
        title: AppointmentNotificationStatus.SENT,
        description: 'Entregado',
      },
      {
        title: AppointmentNotificationStatus.FAILED,
        description: 'Fallido tras agotar los reintentos',
      },
    ],
    skipDuplicates: true,
  });
}
