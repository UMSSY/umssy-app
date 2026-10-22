import type { SurveyNotification } from "../types/survey-notification.types";

const THANKS_DESCRIPTION = "Gracias por completar la encuesta. Tu información ha sido registrada correctamente.";

export const SAMPLE_SURVEY_NOTIFICATIONS: SurveyNotification[] = [
  {
    id: "employability-2026",
    title: "Encuesta de empleabilidad 2026",
    description:
      "Te invitamos a completar la encuesta de empleabilidad para actualizar tu situación laboral y contribuir al seguimiento institucional de titulados.",
    publishedAt: "2026-10-15",
    status: "pending",
  },
  {
    id: "satisfaction-2025",
    title: "Encuesta de satisfacción 2025",
    description: "Esta encuesta estuvo disponible por un tiempo limitado.",
    publishedAt: "2026-09-20",
    status: "expired",
  },
  {
    id: "graduate-follow-up",
    title: "Encuesta de seguimiento a titulados",
    description:
      "Se encuentra disponible una nueva encuesta de seguimiento para titulados. Ingresa para revisar y responder la encuesta asignada.",
    publishedAt: "2026-10-02",
    status: "pending",
  },
  {
    id: "job-placement",
    title: "Encuesta de inserción laboral",
    description: THANKS_DESCRIPTION,
    publishedAt: "2026-09-20",
    status: "answered",
  },
  {
    id: "data-update",
    title: "Encuesta de actualización de datos",
    description: THANKS_DESCRIPTION,
    publishedAt: "2026-07-25",
    status: "answered",
  },
];
