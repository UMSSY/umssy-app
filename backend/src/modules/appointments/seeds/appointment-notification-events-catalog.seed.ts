import type { Prisma } from '../../../prisma/client.js';
import { AppointmentNotificationEvent } from '../enums/appointment-notification-event.enum.js';

export async function seedAppointmentNotificationEventsCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.appointmentNotificationEvent.createMany({
    data: [
      {
        title: AppointmentNotificationEvent.BOOKED,
        description: 'Cita confirmada',
      },
      {
        title: AppointmentNotificationEvent.CANCELLED,
        description: 'Cita cancelada',
      },
    ],
    skipDuplicates: true,
  });
}
