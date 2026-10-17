"use client";

import { useMutation } from "@tanstack/react-query";
import { requirementTermsService } from "../services/requirement-terms.service";
import type { RequirementAnalysis } from "../types/requirement-terms.types";

export function useRequirementAnalysis() {
  return useMutation({
    mutationFn: async (text: string): Promise<RequirementAnalysis> => {
      const startedAt = performance.now();
      const result = await requirementTermsService.analyze(text);
      return { result, elapsedMs: performance.now() - startedAt };
    },
  });
}
