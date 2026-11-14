import type { Prisma } from '../../../prisma/client.js';

export async function seedNotificationTypes(
  tx: Prisma.TransactionClient,
): Promise<void> {
  console.log('Seeding Notification Types Catalog...');

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

  await tx.notificationType.createMany({
    data: notificationTypes,
    skipDuplicates: true,
  });
}