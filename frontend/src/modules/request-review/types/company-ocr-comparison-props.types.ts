import type { CompanyOcrComparisonEntry } from "./company-ocr-comparison-entry.types";

export interface CompanyOcrComparisonProps {
  comparisons: CompanyOcrComparisonEntry[];
  ocrPercentage: number;
  confirmedCount: number;
  unconfirmedCount: number;
  reEvaluatingOcr: boolean;
  submitting: boolean;
  onReEvaluateOcr: () => void;
}
