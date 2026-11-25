import type { ReactNode } from "react";
import type { CvRecordMatchStatus } from "./cv-record-match-status.types";

export interface CvReviewItemProps {
  title: string;
  isChecked: boolean;
  isIncomplete?: boolean;
  matchStatus?: CvRecordMatchStatus;
  onToggle: () => void;
  children?: ReactNode;
}
