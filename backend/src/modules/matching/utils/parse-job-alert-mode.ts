import { DEFAULT_JOB_ALERT_MODE, JOB_ALERT_MODES } from '../constants/job-alert-preference.constants.js';
import type { JobAlertMode } from '../enums/job-alert-mode.enum.js';

export function parseJobAlertMode(value: string | null | undefined): JobAlertMode {
  return JOB_ALERT_MODES.find((mode) => mode === value) ?? DEFAULT_JOB_ALERT_MODE;
}
