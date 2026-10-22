import type { LucideIcon } from "lucide-react";
import type { SurveyListItem } from "./survey.types";

export interface SurveyRowActionsProps {
  survey: SurveyListItem;
}

export interface SurveyRowActionProps {
  // null deja la acción deshabilitada.
  href: string | null;
  label: string;
  icon: LucideIcon;
}
