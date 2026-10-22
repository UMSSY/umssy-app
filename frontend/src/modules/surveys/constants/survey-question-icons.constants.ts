import { CircleChevronDown, CircleDot, Circle, Square, SquareCheck, type LucideIcon } from "lucide-react";
import type { SurveyQuestionType } from "../types/survey.types";

// Ícono del tipo de pregunta (selector y chip de la tarjeta condensada).
export const SURVEY_QUESTION_TYPE_ICONS: Record<SurveyQuestionType, LucideIcon> = {
  SINGLE_CHOICE: CircleDot,
  MULTIPLE_CHOICE: SquareCheck,
  DROPDOWN: CircleChevronDown,
};

// Ícono a la izquierda de cada opción; en la lista desplegable se usa el número de la opción.
export const SURVEY_OPTION_ICONS: Record<Exclude<SurveyQuestionType, "DROPDOWN">, LucideIcon> = {
  SINGLE_CHOICE: Circle,
  MULTIPLE_CHOICE: Square,
};
