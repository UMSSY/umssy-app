import { CAREERS } from "@/modules/access-request";
import type { AcademicPeriod } from "@/modules/reports";
import type {
  AdminRecord,
  GraduateRecord,
  SurveyAnswerRecord,
  SurveyOptionRecord,
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
  SurveyTables,
} from "../types/survey-records.types";
import type { SurveyStatus, SurveyTargetCareer } from "../types/survey.types";
import { SURVEY_TEMPLATES } from "./survey-templates.mock";

// TODO: eliminar con el almacén de ejemplo cuando existan las tablas de encuestas en el backend.

// El backend tomará al creador del token JWT; mientras tanto, las encuestas nuevas se asignan a este administrador.
export const MOCK_CURRENT_ADMIN: AdminRecord = {
  id: "adm-current",
  fullName: "Admin Uno",
  email: "admin.1@umssy.test",
};

const ADMINS: AdminRecord[] = [
  MOCK_CURRENT_ADMIN,
  { id: "adm-juan", fullName: "Juan Dávalos", email: "juan.davalos@umssy.edu" },
  { id: "adm-carla", fullName: "Carla Arce", email: "carla.arce@umssy.edu" },
  { id: "adm-miguel", fullName: "Miguel López", email: "miguel.lopez@umssy.edu" },
  { id: "adm-sofia", fullName: "Sofía Vargas", email: "sofia.vargas@umssy.edu" },
  { id: "adm-pedro", fullName: "Pedro Sánchez", email: "pedro.sanchez@umssy.edu" },
];

const GRADUATE_COUNT = 420;
const GRADUATION_PERIODS: AcademicPeriod[] = [
  "I-2021", "II-2021", "I-2022", "II-2022", "I-2023", "II-2023", "I-2024", "II-2024", "I-2025", "II-2025",
];
const TARGET_CAREERS: SurveyTargetCareer[] = [CAREERS[0], CAREERS[1], null];

type SurveySeed = [id: string, title: string, creatorId: string, period: AcademicPeriod, createdAt: string, status: SurveyStatus];

const SURVEY_SEEDS: SurveySeed[] = [
  ["srv-01", "Encuesta de Egresados 2026", "adm-juan", "II-2026", "2026-10-15T18:22:00.000Z", "PUBLISHED"],
  ["srv-02", "Seguimiento Laboral - Ingeniería", "adm-carla", "II-2026", "2026-10-12T13:21:00.000Z", "DRAFT"],
  ["srv-03", "Encuesta de Inserción Laboral", "adm-miguel", "II-2026", "2026-10-10T20:45:00.000Z", "PUBLISHED"],
  ["srv-04", "Evaluación de Competencias", "adm-sofia", "II-2026", "2026-10-05T15:20:00.000Z", "PUBLISHED"],
  ["srv-05", "Encuesta de Empleabilidad 2026", "adm-pedro", "II-2026", "2026-10-05T17:10:00.000Z", "DRAFT"],
  ["srv-06", "Trayectoria Profesional", "adm-juan", "I-2026", "2026-06-01T13:47:00.000Z", "CLOSED"],
  ["srv-07", "Satisfacción Laboral", "adm-carla", "I-2026", "2026-05-28T16:33:00.000Z", "CLOSED"],
  ["srv-08", "Inserción y Seguimiento", "adm-miguel", "I-2026", "2026-05-25T19:16:00.000Z", "CLOSED"],
  ["srv-09", "Empleabilidad Sistemas I-2026", "adm-sofia", "I-2026", "2026-04-22T14:05:00.000Z", "CLOSED"],
  ["srv-10", "Titulados y Empleabilidad", "adm-pedro", "I-2026", "2026-04-18T18:27:00.000Z", "CLOSED"],
  ["srv-11", "Estudios de Posgrado", "adm-juan", "I-2026", "2026-04-10T12:00:00.000Z", "CLOSED"],
  ["srv-12", "Emprendimiento de Titulados", "adm-carla", "I-2026", "2026-03-30T15:40:00.000Z", "CLOSED"],
  ["srv-13", "Movilidad Laboral II-2025", "adm-miguel", "II-2025", "2025-11-20T14:10:00.000Z", "CLOSED"],
  ["srv-14", "Empleabilidad Informática II-2025", "adm-sofia", "II-2025", "2025-11-12T16:25:00.000Z", "CLOSED"],
  ["srv-15", "Satisfacción con la Formación 2025", "adm-pedro", "II-2025", "2025-10-30T13:55:00.000Z", "CLOSED"],
  ["srv-16", "Primer Empleo de Titulados", "adm-juan", "II-2025", "2025-10-18T19:30:00.000Z", "CLOSED"],
  ["srv-17", "Competencias Digitales", "adm-carla", "II-2025", "2025-09-25T15:00:00.000Z", "CLOSED"],
  ["srv-18", "Seguimiento a Titulados 2025", "adm-miguel", "II-2025", "2025-09-10T12:45:00.000Z", "CLOSED"],
  ["srv-19", "Empleabilidad Sistemas I-2025", "adm-sofia", "I-2025", "2025-05-20T14:30:00.000Z", "CLOSED"],
  ["srv-20", "Inserción Laboral I-2025", "adm-pedro", "I-2025", "2025-05-08T17:15:00.000Z", "CLOSED"],
  ["srv-21", "Expectativas Salariales", "adm-juan", "I-2025", "2025-04-26T13:05:00.000Z", "CLOSED"],
  ["srv-22", "Formación Continua", "adm-carla", "I-2025", "2025-04-14T16:50:00.000Z", "CLOSED"],
  ["srv-23", "Empleabilidad 2025", "adm-miguel", "I-2025", "2025-03-22T14:05:00.000Z", "CLOSED"],
  ["srv-24", "Vinculación con el Sector Productivo", "adm-sofia", "I-2025", "2025-03-10T18:27:00.000Z", "CLOSED"],
];

// Generador pseudoaleatorio con semilla: siempre produce la misma secuencia, así los datos y los tests son estables.
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getPeriodEnd(period: AcademicPeriod): string {
  const [semester, year] = period.split("-");
  return semester === "I" ? `${year}-06-30` : `${year}-12-15`;
}

function pickWeighted(weights: number[], random: () => number): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let target = random() * total;
  for (let index = 0; index < weights.length; index++) {
    target -= weights[index];
    if (target < 0) return index;
  }
  return weights.length - 1;
}

function buildGraduates(random: () => number): GraduateRecord[] {
  return Array.from({ length: GRADUATE_COUNT }, (_, index) => ({
    id: `grd-${index + 1}`,
    career: random() < 0.6 ? CAREERS[0] : CAREERS[1],
    graduationPeriod: GRADUATION_PERIODS[Math.floor(random() * GRADUATION_PERIODS.length)],
  }));
}

export function buildSurveySeed(): SurveyTables {
  const random = createRandom(2026);
  const graduates = buildGraduates(random);
  const surveys: SurveyRecord[] = [];
  const surveyQuestions: SurveyQuestionRecord[] = [];
  const surveyOptions: SurveyOptionRecord[] = [];
  const surveyResponses: SurveyResponseRecord[] = [];
  const surveyAnswers: SurveyAnswerRecord[] = [];

  SURVEY_SEEDS.forEach(([id, title, createdById, period, createdAt, status], surveyIndex) => {
    const targetCareer = TARGET_CAREERS[surveyIndex % TARGET_CAREERS.length];
    const opensAt = addDays(createdAt, 1);
    const template = SURVEY_TEMPLATES[surveyIndex % SURVEY_TEMPLATES.length];

    surveys.push({
      id,
      title,
      description: "Esta encuesta nos ayuda a conocer tu situación laboral actual. Toma aproximadamente 5 minutos.",
      status,
      period,
      targetCareer,
      opensAt,
      closesAt: getPeriodEnd(period),
      createdById,
      createdAt,
    });

    const questions = template.map((question, questionIndex) => {
      const questionId = `${id}-q${questionIndex + 1}`;
      surveyQuestions.push({ id: questionId, surveyId: id, text: question.text, type: question.type, isRequired: question.isRequired, order: questionIndex + 1 });
      const optionIds = question.options.map((text, optionIndex) => {
        const optionId = `${questionId}-o${optionIndex + 1}`;
        surveyOptions.push({ id: optionId, questionId, text, order: optionIndex + 1 });
        return optionId;
      });
      // Pesos al azar por opción; algunas quedan en 0 para ver opciones sin respuestas.
      const weights = optionIds.map(() => (random() < 0.12 ? 0 : 1 + random() * 9));
      return { questionId, optionIds, weights, type: question.type, isRequired: question.isRequired };
    });

    if (status === "DRAFT") return;

    const eligible = graduates.filter((graduate) => targetCareer === null || graduate.career === targetCareer);
    const responseCount = Math.min(eligible.length, 15 + Math.floor(random() * 110));
    const respondents = [...eligible].sort(() => random() - 0.5).slice(0, responseCount);

    respondents.forEach((graduate, responseIndex) => {
      const responseId = `${id}-r${responseIndex + 1}`;
      const startedAt = new Date(`${addDays(opensAt, Math.floor(random() * 20))}T${String(12 + Math.floor(random() * 10)).padStart(2, "0")}:00:00.000Z`);
      const isPartial = random() < 0.15;
      const answeredQuestions = isPartial ? Math.max(1, Math.floor(random() * questions.length)) : questions.length;
      const durationSeconds = 90 + Math.floor(random() * 330);

      surveyResponses.push({
        id: responseId,
        surveyId: id,
        userId: graduate.id,
        startedAt: startedAt.toISOString(),
        completedAt: isPartial ? null : new Date(startedAt.getTime() + durationSeconds * 1000).toISOString(),
      });

      questions.slice(0, answeredQuestions).forEach((question) => {
        if (!question.isRequired && random() < 0.2) return;
        const chosen = new Set<number>([pickWeighted(question.weights, random)]);
        if (question.type === "MULTIPLE_CHOICE") {
          const extra = Math.floor(random() * 3);
          for (let count = 0; count < extra; count++) chosen.add(pickWeighted(question.weights, random));
        }
        chosen.forEach((optionIndex) => {
          surveyAnswers.push({
            id: `${responseId}-${question.questionId.split("-").pop()}-${optionIndex + 1}`,
            responseId,
            questionId: question.questionId,
            optionId: question.optionIds[optionIndex],
          });
        });
      });
    });
  });

  return { admins: ADMINS, graduates, surveys, surveyQuestions, surveyOptions, surveyResponses, surveyAnswers };
}
