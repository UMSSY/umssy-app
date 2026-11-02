import type { z } from 'zod';
import type { myAppointmentsQuerySchema } from '../requests/my-appointments-query.request.js';

export type MyAppointmentsQuery = z.infer<typeof myAppointmentsQuerySchema>;
