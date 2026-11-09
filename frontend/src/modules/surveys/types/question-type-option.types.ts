import type { LucideIcon } from "lucide-react";
import type { QuestionType } from "./question-type.types";

export interface QuestionTypeOption {
  value: QuestionType;
  label: string;
  icon: LucideIcon;
}
