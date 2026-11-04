import type { SurveyCreator, SurveyHistoryItem } from "../types/survey-history.types";

// Datos simulados temporales hasta que el endpoint del historial de encuestas esté disponible.
const JUAN_DAVALOS: SurveyCreator = { id: "admin-1", fullName: "Juan Dávalos", email: "juan.davalos@umssy.edu" };
const CARLA_ARCE: SurveyCreator = { id: "admin-2", fullName: "Carla Arce", email: "carla.arce@umssy.edu" };
const MIGUEL_LOPEZ: SurveyCreator = { id: "admin-3", fullName: "Miguel Lopez", email: "miguel.lopez@umssy.edu" };

export const SURVEY_HISTORY_MOCK: readonly SurveyHistoryItem[] = [
  {
    id: "survey-history-1",
    title: "Encuesta de Egresados 2026",
    description: "Conoce la situación laboral de los egresados de la gestión 2026.",
    creator: JUAN_DAVALOS,
    academicPeriod: "II-2026",
    careerTitle: null,
    questionCount: 12,
    responseCount: 148,
    status: "active",
    createdAt: "2026-10-15T14:32:00",
  },
  {
    id: "survey-history-2",
    title: "Seguimiento Laboral - Ingeniería",
    description: "Seguimiento de la inserción laboral de los titulados de las carreras de ingeniería.",
    creator: CARLA_ARCE,
    academicPeriod: "II-2026",
    careerTitle: "Ingeniería de Sistemas",
    questionCount: 8,
    responseCount: 63,
    status: "inactive",
    createdAt: "2026-10-12T09:21:00",
  },
  {
    id: "survey-history-3",
    title: "Encuesta de Inserción Laboral",
    description: "Mide el tiempo que tardan los titulados en conseguir su primer empleo.",
    creator: MIGUEL_LOPEZ,
    academicPeriod: "I-2026",
    careerTitle: null,
    questionCount: 10,
    responseCount: 97,
    status: "active",
    createdAt: "2026-04-10T16:45:00",
  },
  {
    id: "survey-history-4",
    title: "Encuesta de Satisfacción de Titulados",
    description: "Evalúa la satisfacción de los titulados con la formación recibida.",
    creator: CARLA_ARCE,
    academicPeriod: "II-2025",
    careerTitle: null,
    questionCount: 6,
    responseCount: 41,
    status: "inactive",
    createdAt: "2025-09-18T11:05:00",
  },
];
