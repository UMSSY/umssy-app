import { z } from 'zod';

export const appointmentIdSchema = z.uuid({
  error: 'El id de la cita no es válido',
});
