import type { ProgressStepperProps } from "../../types/progress-stepper-props.types";
import { WorkflowSteps } from "@/shared/components/layout/workflow-steps";
import { MENTORSHIP_STEPS } from "../../constants/mentorship-steps.constants";

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <WorkflowSteps
      steps={MENTORSHIP_STEPS}
      currentStep={currentStep}
      label="Progreso de configuración de mentoría"
    />
  );
}
