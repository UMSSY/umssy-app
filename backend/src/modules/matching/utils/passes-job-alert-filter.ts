import {
  JOB_ALERT_HIGH_AFFINITY_MIN_SCORE,
  JOB_ALERT_MATCHING_MIN_SCORE_EXCLUSIVE,
} from '../constants/job-alert-preference.constants.js';
import { JobAlertMode } from '../enums/job-alert-mode.enum.js';

export function passesJobAlertFilter(mode: JobAlertMode, score: number): boolean {
  if (mode === JobAlertMode.MATCHING) return score > JOB_ALERT_MATCHING_MIN_SCORE_EXCLUSIVE;
  if (mode === JobAlertMode.HIGH_AFFINITY) return score >= JOB_ALERT_HIGH_AFFINITY_MIN_SCORE;
  return true;
}
