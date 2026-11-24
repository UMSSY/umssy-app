import type { JobAlertMode } from "./job-alert-mode.types";

export interface JobAlertPreference {
  mode: JobAlertMode;
  savedMode: JobAlertMode;
  canFilterByProfile: boolean;
}
