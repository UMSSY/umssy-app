import type { Prisma } from '../../../prisma/client.js';
import { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';

export async function seedAppointmentNotificationChannelsCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.appointmentNotificationChannel.createMany({
    data: [
      {
        title: AppointmentNotificationChannel.IN_APP,
        description: 'Campana de notificaciones',
      },
      {
        title: AppointmentNotificationChannel.EMAIL,
        description: 'Correo electrónico',
      },
      {
        title: AppointmentNotificationChannel.PUSH,
        description: 'Notificación push',
      },
    ],
    skipDuplicates: true,
  });
}
