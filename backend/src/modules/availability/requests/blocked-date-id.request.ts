import { z } from 'zod';
import { BLOCKED_DATE_MESSAGES } from '../constants/blocked-date.constants.js';

export const blockedDateIdSchema = z.uuid({ error: BLOCKED_DATE_MESSAGES.invalidId });
