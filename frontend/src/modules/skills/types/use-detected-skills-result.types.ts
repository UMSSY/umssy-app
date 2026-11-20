import type { DetectedSkillsSummary } from "./detected-skills-summary.types";

export interface UseDetectedSkillsResult {
  summary: DetectedSkillsSummary | null;
  isLoading: boolean;
  hasLoadError: boolean;
  isAnalyzing: boolean;
  analyze: () => void;
}
