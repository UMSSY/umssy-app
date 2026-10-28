import type { AppointmentRequestValues } from "./appointment-request-values.types";

export type AppointmentRequestErrors = Partial<Record<keyof AppointmentRequestValues, string>>;
