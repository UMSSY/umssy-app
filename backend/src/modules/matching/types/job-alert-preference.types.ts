import type { JobAlertMode } from '../enums/job-alert-mode.enum.js';

export type JobAlertPreference = {
  mode: JobAlertMode;
  savedMode: JobAlertMode;
  canFilterByProfile: boolean;
};
