import type { SurveyCreator, SurveyListItem } from "../types/survey.types";

// TODO: eliminar estos datos de ejemplo cuando exista el endpoint de encuestas en el backend.
const JUAN: SurveyCreator = { fullName: "Juan Dávalos", email: "juan.davalos@umssy.edu" };
const CARLA: SurveyCreator = { fullName: "Carla Arce", email: "carla.arce@umssy.edu" };
const MIGUEL: SurveyCreator = { fullName: "Miguel López", email: "miguel.lopez@umssy.edu" };
const SOFIA: SurveyCreator = { fullName: "Sofía Vargas", email: "sofia.vargas@umssy.edu" };
const PEDRO: SurveyCreator = { fullName: "Pedro Sánchez", email: "pedro.sanchez@umssy.edu" };

export const SURVEYS_MOCK: SurveyListItem[] = [
  { id: "srv-01", title: "Encuesta de Egresados 2026", creator: JUAN, period: "II-2026", createdAt: "2026-10-15T18:22:00.000Z", status: "PUBLISHED" },
  { id: "srv-02", title: "Seguimiento Laboral - Ingeniería", creator: CARLA, period: "II-2026", createdAt: "2026-10-12T13:21:00.000Z", status: "DRAFT" },
  { id: "srv-03", title: "Encuesta de Inserción Laboral", creator: MIGUEL, period: "II-2026", createdAt: "2026-10-10T20:45:00.000Z", status: "PUBLISHED" },
  { id: "srv-04", title: "Evaluación de Competencias", creator: SOFIA, period: "II-2026", createdAt: "2026-10-05T15:20:00.000Z", status: "PUBLISHED" },
  { id: "srv-05", title: "Encuesta de Empleabilidad 2026", creator: PEDRO, period: "II-2026", createdAt: "2026-10-05T17:10:00.000Z", status: "DRAFT" },
  { id: "srv-06", title: "Trayectoria Profesional", creator: JUAN, period: "I-2026", createdAt: "2026-06-01T13:47:00.000Z", status: "CLOSED" },
  { id: "srv-07", title: "Satisfacción Laboral", creator: CARLA, period: "I-2026", createdAt: "2026-05-28T16:33:00.000Z", status: "CLOSED" },
  { id: "srv-08", title: "Inserción y Seguimiento", creator: MIGUEL, period: "I-2026", createdAt: "2026-05-25T19:16:00.000Z", status: "CLOSED" },
  { id: "srv-09", title: "Empleabilidad Sistemas I-2026", creator: SOFIA, period: "I-2026", createdAt: "2026-04-22T14:05:00.000Z", status: "CLOSED" },
  { id: "srv-10", title: "Titulados y Empleabilidad", creator: PEDRO, period: "I-2026", createdAt: "2026-04-18T18:27:00.000Z", status: "CLOSED" },
  { id: "srv-11", title: "Estudios de Posgrado", creator: JUAN, period: "I-2026", createdAt: "2026-04-10T12:00:00.000Z", status: "CLOSED" },
  { id: "srv-12", title: "Emprendimiento de Titulados", creator: CARLA, period: "I-2026", createdAt: "2026-03-30T15:40:00.000Z", status: "CLOSED" },
  { id: "srv-13", title: "Movilidad Laboral II-2025", creator: MIGUEL, period: "II-2025", createdAt: "2025-11-20T14:10:00.000Z", status: "CLOSED" },
  { id: "srv-14", title: "Empleabilidad Informática II-2025", creator: SOFIA, period: "II-2025", createdAt: "2025-11-12T16:25:00.000Z", status: "CLOSED" },
  { id: "srv-15", title: "Satisfacción con la Formación 2025", creator: PEDRO, period: "II-2025", createdAt: "2025-10-30T13:55:00.000Z", status: "CLOSED" },
  { id: "srv-16", title: "Primer Empleo de Titulados", creator: JUAN, period: "II-2025", createdAt: "2025-10-18T19:30:00.000Z", status: "CLOSED" },
  { id: "srv-17", title: "Competencias Digitales", creator: CARLA, period: "II-2025", createdAt: "2025-09-25T15:00:00.000Z", status: "CLOSED" },
  { id: "srv-18", title: "Seguimiento a Titulados 2025", creator: MIGUEL, period: "II-2025", createdAt: "2025-09-10T12:45:00.000Z", status: "CLOSED" },
  { id: "srv-19", title: "Empleabilidad Sistemas I-2025", creator: SOFIA, period: "I-2025", createdAt: "2025-05-20T14:30:00.000Z", status: "CLOSED" },
  { id: "srv-20", title: "Inserción Laboral I-2025", creator: PEDRO, period: "I-2025", createdAt: "2025-05-08T17:15:00.000Z", status: "CLOSED" },
  { id: "srv-21", title: "Expectativas Salariales", creator: JUAN, period: "I-2025", createdAt: "2025-04-26T13:05:00.000Z", status: "CLOSED" },
  { id: "srv-22", title: "Formación Continua", creator: CARLA, period: "I-2025", createdAt: "2025-04-14T16:50:00.000Z", status: "CLOSED" },
  { id: "srv-23", title: "Empleabilidad 2025", creator: MIGUEL, period: "I-2025", createdAt: "2025-03-22T14:05:00.000Z", status: "CLOSED" },
  { id: "srv-24", title: "Vinculación con el Sector Productivo", creator: SOFIA, period: "I-2025", createdAt: "2025-03-10T18:27:00.000Z", status: "CLOSED" },
];
