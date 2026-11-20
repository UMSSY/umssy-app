import type { ReactNode } from "react";
import type { MentorshipStep } from "./mentorship-step.types";

export interface MentorshipWizardShellProps {
  currentStep: MentorshipStep;
  canGoBack: boolean;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
}
