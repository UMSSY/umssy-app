import type { BlockFormField } from "../types/block-form-field.types";
import type { BlockFormMode } from "../types/block-form-mode.types";
import { pad } from "../utils/pad";

export const BLOCK_MESSAGES = {
  endBeforeStart: "La hora de fin debe ser posterior a la hora de inicio",
  startInPast: "La hora de inicio ya pasó",
  outOfRange: `El horario debe estar entre las ${pad(7)}:00 y las ${pad(22)}:00`,
  invalidStep: `Las horas deben ir en intervalos de 30 minutos`,
  differentDays: "El bloque debe empezar y terminar el mismo día",
} as const;

export const FORM_TEXT: Record<
  BlockFormMode,
  { title: string; description: string; submit: string; dateLabel: string; startLabel: string; endLabel: string }
> = {
  create: {
    title: "Nuevo bloque de disponibilidad",
    description: "Elige la fecha y el horario en que puedes atender sesiones de mentoría.",
    submit: "Guardar bloque",
    dateLabel: "Fecha",
    startLabel: "Hora de inicio",
    endLabel: "Hora de fin",
  },
  edit: {
    title: "Editar bloque",
    description: "Modifica la hora de inicio o de fin del bloque.",
    submit: "Guardar cambios",
    dateLabel: "Día",
    startLabel: "Desde",
    endLabel: "Hasta",
  },
};

export const REQUIRED_MESSAGES: Record<BlockFormField, string> = {
  date: "Selecciona una fecha",
  startAt: "Selecciona la hora de inicio",
  endAt: "Selecciona la hora de fin",
  repeatUntil: "Elige hasta qué fecha se repite el bloque",
};

export const REPEAT_WEEKLY_TEXT = {
  checkboxLabel: "Repetir cada semana",
  untilLabel: "Repetir hasta",
  hint: `Se crea un bloque por semana hasta la fecha elegida (máximo 12 semanas).`,
} as const;

export const TIME_OPTIONS: string[] = Array.from(
  { length: ((22 - 7) * 60) / 30 + 1 },
  (_, index) => {
    const minutes = 7 * 60 + index * 30;
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  },
);
