import type { JobAlertMode } from "./job-alert-mode.types";

export interface JobAlertOption {
  value: JobAlertMode;
  label: string;
  description: string;
  requiresSkills: boolean;
}
