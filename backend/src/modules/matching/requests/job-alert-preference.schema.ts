import { z } from 'zod';
import { JobAlertMode } from '../enums/job-alert-mode.enum.js';

export const jobAlertPreferenceSchema = z
  .object({
    mode: z.enum(JobAlertMode, {
      error: 'La preferencia de avisos no es válida',
    }),
  })
  .strict();

export type JobAlertPreferenceRequest = z.infer<typeof jobAlertPreferenceSchema>;
