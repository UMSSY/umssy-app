import { JobAlertMode } from '../enums/job-alert-mode.enum.js';

export const JOB_ALERT_MODES = Object.values(JobAlertMode);
export const DEFAULT_JOB_ALERT_MODE = JobAlertMode.ALL;
export const JOB_ALERT_MATCHING_MIN_SCORE_EXCLUSIVE = 0;
export const JOB_ALERT_HIGH_AFFINITY_MIN_SCORE = 70;
export const JOB_ALERT_RECIPIENT_ROLES = ['estudiante', 'titulado'] as const;
export const JOB_ALERT_SCORING_BATCH_SIZE = 25;
export const JOB_ALERT_SKILLS_REQUIRED_MESSAGE =
  'Para activar estas opciones, añade al menos una habilidad a tu perfil.';
