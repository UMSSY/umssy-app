import type { CvApplyTask } from "./cv-apply-task.types";

export interface CvApplyResult {
  task: CvApplyTask;
  isApplied: boolean;
}
