import { z } from 'zod';

export const GetNotificationsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const NotificationIdParamSchema = z.object({
  id: z.string().uuid('El ID de la notificación debe ser un UUID válido'),
});