import type { CvApplyResult } from "../types/cv-apply-result.types";
import type { CvApplyTask } from "../types/cv-apply-task.types";

export function runCvApplyTasks(tasks: readonly CvApplyTask[]): Promise<CvApplyResult[]> {
  return (tasks ?? []).reduce<Promise<CvApplyResult[]>>(async (previous, task) => {
    const results = await previous;
    const isApplied = await task.run().then(
      () => true,
      () => false,
    );
    return [...results, { task, isApplied }];
  }, Promise.resolve([]));
}
