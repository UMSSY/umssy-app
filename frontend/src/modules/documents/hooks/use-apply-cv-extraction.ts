"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useInvalidateProfileCompleteness, type ProfileResponse } from "@/modules/profile";
import { CV_APPLY_INVALIDATED_QUERY_KEYS } from "../constants/cv-apply.constants";
import type { CvApplyReport } from "../types/cv-apply-report.types";
import type { CvApplyResult } from "../types/cv-apply-result.types";
import type { CvApplyTask } from "../types/cv-apply-task.types";
import type { CvExtraction } from "../types/cv-extraction.types";
import type { CvExtractionSelection } from "../types/cv-extraction-selection.types";
import { buildCvApplyReport } from "../utils/build-cv-apply-report";
import { buildCvApplyTasks } from "../utils/build-cv-apply-tasks";
import { runCvApplyTasks } from "../utils/run-cv-apply-tasks";

export function useApplyCvExtraction() {
  const queryClient = useQueryClient();
  const invalidateCompleteness = useInvalidateProfileCompleteness();
  const [report, setReport] = useState<CvApplyReport | null>(null);
  const mutation = useMutation({
    mutationFn: (tasks: CvApplyTask[]) => runCvApplyTasks(tasks),
    onSuccess: async (results) => {
      setReport(buildCvApplyReport(results));
      if (!results.some(({ isApplied }) => isApplied)) return;
      await Promise.all([
        ...CV_APPLY_INVALIDATED_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        invalidateCompleteness(),
      ]);
    },
  });

  return {
    report,
    isApplying: mutation.isPending,
    apply: (
      extraction: CvExtraction,
      selection: CvExtractionSelection,
      profile: ProfileResponse | null,
    ): Promise<CvApplyResult[]> => mutation.mutateAsync(buildCvApplyTasks(extraction, selection, profile)),
    reset: () => {
      mutation.reset();
      setReport(null);
    },
  };
}
