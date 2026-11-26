import type { Prisma } from '../../../../src/prisma/client.js';
import type { FixtureContext } from '../../../../src/common/database/fixture-context.js';

export async function seedNotificationFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  console.log('Seeding Notification Fixtures...');
  let createdCount = 0;

  const user2 = await tx.user.findUnique({ where: { email: 'carlos@example.com' } });
  const user3 = await tx.user.findUnique({ where: { email: 'lucia@example.com' } });
  const user4 = await tx.user.findUnique({ where: { email: 'maria@example.com' } });

  if (!user2 || !user3 || !user4) {
    console.warn('No se encontraron usuarios de prueba. Saltando fixtures.');
    return 0;
  }

  const prefs = await tx.notificationPreference.createMany({
    data: [
      { userId: user2.id, pushEnabled: true, emailEnabled: true, inAppEnabled: true },
      { userId: user3.id, pushEnabled: false, emailEnabled: true, inAppEnabled: true },
      { userId: user4.id, pushEnabled: false, emailEnabled: false, inAppEnabled: true },
    ],
    skipDuplicates: true,
  });
  createdCount += prefs.count;

  const sub = await tx.pushSubscription.upsert({
    where: { endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint-123' },
    update: {},
    create: {
      userId: user2.id,
      endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint-123',
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtZx6tQp9yJ1q6vF1WvJqF4q9y7u4V6B1q3s4d5f6g7h8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5A',
      auth: 'tBHItJI5svbpez7KI4CCXg',
      userAgent: 'Mozilla/5.0 (Linux; Android 10) Test Device',
    },
  });
  if (sub) createdCount++;

  const chatType = await tx.notificationType.findUnique({ where: { code: 'CHAT_MESSAGE' } });
  const appointmentType = await tx.notificationType.findUnique({ where: { code: 'APPOINTMENT_BOOKED' } });
  const surveyType = await tx.notificationType.findUnique({ where: { code: 'SURVEY_PUBLISHED' } });

  if (chatType && appointmentType && surveyType) {
    const notifs = await tx.notification.createMany({
      data: [
        { recipientId: user2.id, typeId: chatType.id, title: 'Mensaje nuevo', body: 'Hola Carlos...', link: '/chat/123', groupKey: 'chat_123' },
        { recipientId: user3.id, typeId: appointmentType.id, title: 'Cita confirmada', body: 'Tu cita ha sido confirmada.', link: '/appointments/456', readAt: new Date() },
        { recipientId: user4.id, typeId: surveyType.id, title: 'Nueva encuesta', body: 'Ayúdanos respondiendo...', link: '/surveys/789' },
      ],
      skipDuplicates: true,
    });
    createdCount += notifs.count;
  }

  console.log(`Se crearon ${createdCount} registros de notificaciones de prueba.`);
  return createdCount;
}