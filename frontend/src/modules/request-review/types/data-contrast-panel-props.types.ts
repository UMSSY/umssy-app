import type { ReviewDetail } from "./request-review.types";
import type { OcrAnalysisResult } from "./ocr.types";

export interface DataContrastPanelProps {
  detail: ReviewDetail;
  ocrAnalysis?: OcrAnalysisResult;
}
