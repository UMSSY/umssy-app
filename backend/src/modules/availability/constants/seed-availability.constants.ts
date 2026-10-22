import { BLOCK_STEP_MINUTES } from './create-block.constants.js';

export const MS_PER_MINUTE = 60_000;
export const MS_PER_DAY = 86_400_000;
export const STEP_MS = BLOCK_STEP_MINUTES * MS_PER_MINUTE;

export const PERFORMANCE_APPOINTMENTS = 50;

// Identidades reservadas a B-08: no dependen de la fecha de ejecución.
export const SEED_BLOCK_IDS = Array.from({ length: 58 }, (_, index) =>
  `b0800000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
);
export const SEED_APPOINTMENT_IDS = Array.from({ length: 53 }, (_, index) =>
  `b0800001-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
);
export const SEED_BLOCKED_DATE_ID = 'b0800002-0000-4000-8000-000000000001';
export const SEED_SERIES_ID = 'b0800003-0000-4000-8000-000000000001';
