import type { ReactNode } from "react";

export interface CvReviewItemProps {
  title: string;
  isChecked: boolean;
  isIncomplete?: boolean;
  onToggle: () => void;
  children?: ReactNode;
}
