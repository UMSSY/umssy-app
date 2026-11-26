"use client";
import { useMutation } from "@tanstack/react-query";
import { surveysService } from "../services/surveys.service";

export function useExportSurveyReport(id: string, period?: string) {
  return useMutation({
    mutationFn: () => surveysService.exportSurveyPdf(id, period),
  });
}
