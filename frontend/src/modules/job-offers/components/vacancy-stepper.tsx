import { WorkflowSteps } from "@/shared/components/layout/workflow-steps";
interface VacancyStepperProps { currentStep: number; }
const VACANCY_STEPS = [
  { id: 1, label: "Información y condiciones" },
  { id: 2, label: "Descripción y requisitos" },
  { id: 3, label: "Vista previa" },
];
export function VacancyStepper({ currentStep }: VacancyStepperProps) {
  return <WorkflowSteps steps={VACANCY_STEPS} currentStep={currentStep} label="Progreso de publicación de vacante" />;
}
