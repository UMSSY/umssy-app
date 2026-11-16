import type { RecruiterApplicationState } from "../types/recruiter-application-state.types";

export const RECRUITER_APPLICATION_STATE_LABELS: Record<
  RecruiterApplicationState,
  string
> = {
  applied: "Postulación en revisión",
  interview: "En entrevista",
  hired: "Contratado",
  rejected: "No seleccionado",
  withdrawn: "Postulación retirada",
};
