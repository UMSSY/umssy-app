import { z } from 'zod';
import { APPOINTMENT_MESSAGES } from '../constants/appointment-docs.constants.js';

export const appointmentIdSchema = z.uuid({
  error: APPOINTMENT_MESSAGES.invalidId,
});
