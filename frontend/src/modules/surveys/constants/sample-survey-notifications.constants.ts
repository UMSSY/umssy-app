import type { SurveyNotification } from "../types/survey-notification.types";

export const SAMPLE_SURVEY_NOTIFICATIONS: SurveyNotification[] = [
  { id: "employability-2026", title: "Encuesta de empleabilidad 2026", publishedAt: "2026-10-15", status: "pending" },
  { id: "satisfaction-2025", title: "Encuesta de satisfacción 2025", publishedAt: "2026-09-20", status: "expired" },
  { id: "graduate-follow-up", title: "Encuesta de seguimiento a titulados", publishedAt: "2026-10-02", status: "pending" },
  { id: "job-placement", title: "Encuesta de inserción laboral", publishedAt: "2026-09-20", status: "answered" },
  { id: "data-update", title: "Encuesta de actualización de datos", publishedAt: "2026-07-25", status: "answered" },
];
