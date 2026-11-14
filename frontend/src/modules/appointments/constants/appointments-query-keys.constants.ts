import type { AppointmentScope } from "../types/appointment-scope.types";

export const APPOINTMENTS_QUERY_KEYS = {
  all: ["appointments"] as const,
  mine: (scope: AppointmentScope, page: number) => ["appointments", "mine", scope, page] as const,
  detail: (id: string) => ["appointments", "detail", id] as const,
  counterpartPhoto: (id: string) => ["appointments", "detail", id, "counterpart-photo"] as const,
};
