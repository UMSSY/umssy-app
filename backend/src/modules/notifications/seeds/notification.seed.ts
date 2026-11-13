import { PrismaClient } from '../../../../src/prisma/client.js';

export async function seedNotifications(prisma: PrismaClient) {
  console.log('Seeding Notification Types...');

  const notificationTypes = [
    { code: 'CHAT_MESSAGE', name: 'Mensaje nuevo de chat privado', sendsPush: true, sendsEmail: false },
    { code: 'CHAT_GROUP_MESSAGE', name: 'Mensaje nuevo en chat grupal', sendsPush: true, sendsEmail: false },
    { code: 'CONNECTION_REQUEST_RECEIVED', name: 'Solicitud de conexión', sendsPush: true, sendsEmail: true },
    { code: 'CONNECTION_REQUEST_ACCEPTED', name: 'Solicitud aceptada', sendsPush: true, sendsEmail: false },
    { code: 'MENTOR_SLOT_OFFERED', name: 'Cupo disponible para ser mentor', sendsPush: true, sendsEmail: true },
    { code: 'RADAR_PUBLISHED', name: 'Nueva versión del Radar publicada', sendsPush: true, sendsEmail: false },
    { code: 'APPOINTMENT_CANCELLED', name: 'Cita cancelada', sendsPush: true, sendsEmail: true },
    { code: 'APPOINTMENT_BOOKED', name: 'Cita confirmada', sendsPush: true, sendsEmail: true },
    { code: 'SURVEY_PUBLISHED', name: 'Encuesta publicada', sendsPush: true, sendsEmail: true },
    { code: 'APPLICATION_STATUS_CHANGED', name: 'Cambio de estado de una postulación', sendsPush: true, sendsEmail: false },
    { code: 'NEW_JOB_APPLICANT', name: 'Nuevo postulante en una vacante', sendsPush: true, sendsEmail: true },
    { code: 'EVENT_STARTING_SOON', name: 'Evento por comenzar', sendsPush: true, sendsEmail: false },
    { code: 'ACCESS_REQUEST_APPROVED', name: 'Solicitud de acceso aprobada', sendsPush: true, sendsEmail: true },
  ];

  for (const type of notificationTypes) {
    await prisma.notificationType.upsert({
      where: { code: type.code },
      update: { name: type.name, sendsPush: type.sendsPush, sendsEmail: type.sendsEmail },
      create: type,
    });
  }

  const user2 = await prisma.user.findUnique({ where: { email: 'carlos@example.com' } });
  const user3 = await prisma.user.findUnique({ where: { email: 'lucia@example.com' } });
  const user4 = await prisma.user.findUnique({ where: { email: 'maria@example.com' } });

  if (!user2 || !user3 || !user4) {
    console.warn('No se encontraron usuarios de prueba. Saltando creación de notificaciones de prueba.');
    return;
  }

  await prisma.notificationPreference.createMany({
    data: [
      { userId: user2.id, pushEnabled: true, emailEnabled: true, inAppEnabled: true },
      { userId: user3.id, pushEnabled: false, emailEnabled: true, inAppEnabled: true },
      { userId: user4.id, pushEnabled: false, emailEnabled: false, inAppEnabled: true },
    ],
    skipDuplicates: true,
  });
  await prisma.pushSubscription.upsert({
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

  
  const chatType = await prisma.notificationType.findUnique({ where: { code: 'CHAT_MESSAGE' } });
  const appointmentType = await prisma.notificationType.findUnique({ where: { code: 'APPOINTMENT_BOOKED' } });
  const surveyType = await prisma.notificationType.findUnique({ where: { code: 'SURVEY_PUBLISHED' } });

  if (chatType && appointmentType && surveyType) {
    await prisma.notification.createMany({
      data: [
      
        {
          recipientId: user2.id,
          typeId: chatType.id,
          title: 'Mensaje nuevo',
          body: 'Hola Carlos, ¿cómo va todo?',
          link: '/chat/123',
          groupKey: 'chat_123',
          readAt: null,
        },
       
        {
          recipientId: user3.id,
          typeId: appointmentType.id,
          title: 'Cita confirmada',
          body: 'Tu cita de mentoría ha sido confirmada.',
          link: '/appointments/456',
          readAt: new Date(),
        },
    
        {
          recipientId: user4.id,
          typeId: surveyType.id,
          title: 'Nueva encuesta',
          body: 'Ayúdanos respondiendo la encuesta de empleabilidad.',
          link: '/surveys/789',
          readAt: null,
        }
      ],
      skipDuplicates: true,
    });
  }

  console.log('Notifications seeded successfully.');
}