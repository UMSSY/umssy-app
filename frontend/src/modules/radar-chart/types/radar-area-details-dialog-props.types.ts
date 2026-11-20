import type { ReactNode } from "react";
import type { AreaEvidenceDetails } from "./radar-evidence-details.types";

export interface RadarAreaDetailsDialogProps {
  areaName: string;
  position: number;
  score: number;
  globalAverage: number;
  evidence: AreaEvidenceDetails;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onClose: () => void;
  subtitle?: string;
  footer?: ReactNode;
}
