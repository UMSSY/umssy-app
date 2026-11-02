import type { AppointmentScope } from "../types/appointment-scope.types";

export const APPOINTMENTS_QUERY_KEYS = {
  all: ["appointments"] as const,
  mine: (scope: AppointmentScope) => ["appointments", "mine", scope] as const,
};
