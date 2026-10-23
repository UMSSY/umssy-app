import type {
  GraduateRecord,
  SurveyAnswerRecord,
  SurveyOptionRecord,
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
} from "../types/survey-records.types";
import type { SurveyQuestionType } from "../types/survey.types";

// TODO: eliminar con el almacén de ejemplo. Encuesta de demostración con resultados fijos (no al azar),
// basada en las preguntas del mockup, para ver cómo quedan las métricas y los gráficos.

export const SHOWCASE_SURVEY_ID = "srv-demo";

const RESPONDENTS = 248;
const COMPLETED = 211;

interface ShowcaseQuestion {
  text: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  // Cantidad de respuestas de cada opción, en el mismo orden que las opciones.
  options: [text: string, count: number][];
}

const QUESTIONS: ShowcaseQuestion[] = [
  {
    text: "¿Cuál es tu condición laboral actual?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: [
      ["Empleado en el sector privado", 132],
      ["Empleado en el sector público / Estado", 26],
      ["Independiente / Freelance / Consultor", 31],
      ["Emprendedor con empresa propia", 12],
      ["En búsqueda activa de empleo", 37],
      ["No busca empleo por el momento", 8],
    ],
  },
  {
    text: "¿Cuánto tiempo tardaste en obtener tu primer empleo profesional?",
    type: "DROPDOWN",
    isRequired: true,
    options: [
      ["Ya trabajaba", 45],
      ["Menos de 2 meses", 69],
      ["De 2 a 3 meses", 55],
      ["De 6 a 12 meses", 33],
      ["Más de 12 meses", 0],
      ["Aún no lo obtengo", 21],
    ],
  },
  {
    text: "¿Tu trabajo actual guarda relación con la carrera de Sistemas?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: [
      ["Altamente", 98],
      ["Moderadamente", 61],
      ["Baja relación", 28],
      ["No relacionada", 16],
    ],
  },
  {
    text: "¿Cuál es tu rango de ingreso mensual bruto (en Bs)?",
    type: "DROPDOWN",
    isRequired: true,
    options: [
      ["0 - 2.000 Bs", 14],
      ["2.001 - 4.000 Bs", 51],
      ["4.001 - 8.000 Bs", 90],
      ["Mayor a 8.000 Bs", 40],
    ],
  },
  {
    text: "¿En qué área o rol técnico te desempeñas principalmente?",
    type: "MULTIPLE_CHOICE",
    isRequired: true,
    options: [
      ["Desarrollo de Software", 84],
      ["Datos e Inteligencia Artificial", 34],
      ["Infraestructura, DevOps y Ciberseguridad", 31],
      ["Gestión de Proyectos / Liderazgo TI", 22],
      ["Otra área / No aplica", 27],
    ],
  },
  {
    text: "¿La formación recibida se ajusta a las exigencias del mercado?",
    type: "SINGLE_CHOICE",
    isRequired: false,
    options: [
      ["De acuerdo y totalmente", 115],
      ["En desacuerdo o levemente", 21],
      ["Parcialmente", 38],
      ["No estoy seguro", 9],
    ],
  },
];

// Personas que responden la pregunta de opción múltiple; algunas marcan dos opciones.
const MULTIPLE_CHOICE_RESPONDENTS = 190;

export function buildShowcaseSurvey(graduates: GraduateRecord[]) {
  const survey: SurveyRecord = {
    id: SHOWCASE_SURVEY_ID,
    title: "Encuesta de Empleabilidad de Egresados (ejemplo)",
    description: "Esta encuesta nos ayuda a conocer tu situación laboral actual. Toma aproximadamente 5 minutos.",
    status: "PUBLISHED",
    period: "II-2026",
    targetCareer: null,
    opensAt: "2026-10-21",
    closesAt: "2026-12-15",
    createdById: "adm-current",
    createdAt: "2026-10-21T13:00:00.000Z",
  };
  const surveyQuestions: SurveyQuestionRecord[] = [];
  const surveyOptions: SurveyOptionRecord[] = [];
  const surveyAnswers: SurveyAnswerRecord[] = [];

  // Los primeros 211 completaron la encuesta; los demás la dejaron a medias y solo respondieron las primeras preguntas.
  const surveyResponses: SurveyResponseRecord[] = graduates.slice(0, RESPONDENTS).map((graduate, index) => {
    const startedAt = new Date(Date.UTC(2026, 9, 21 + (index % 2), 12 + (index % 9), index % 60));
    const durationSeconds = 150 + ((index * 37) % 151);
    return {
      id: `${SHOWCASE_SURVEY_ID}-r${index + 1}`,
      surveyId: SHOWCASE_SURVEY_ID,
      userId: graduate.id,
      startedAt: startedAt.toISOString(),
      completedAt: index < COMPLETED ? new Date(startedAt.getTime() + durationSeconds * 1000).toISOString() : null,
    };
  });

  QUESTIONS.forEach((question, questionIndex) => {
    const questionId = `${SHOWCASE_SURVEY_ID}-q${questionIndex + 1}`;
    surveyQuestions.push({ id: questionId, surveyId: SHOWCASE_SURVEY_ID, text: question.text, type: question.type, isRequired: question.isRequired, order: questionIndex + 1 });
    const optionIds = question.options.map(([text], optionIndex) => {
      const id = `${questionId}-o${optionIndex + 1}`;
      surveyOptions.push({ id, questionId, text, order: optionIndex + 1 });
      return id;
    });
    const addAnswer = (respondent: number, optionIndex: number) =>
      surveyAnswers.push({
        id: `${questionId}-a${surveyAnswers.length + 1}`,
        responseId: surveyResponses[respondent].id,
        questionId,
        optionId: optionIds[optionIndex],
      });

    // Cada selección se reparte entre los encuestados en orden; en opción múltiple se vuelve a empezar
    // por el primero para que algunos marquen más de una opción.
    const respondentsForQuestion = question.type === "MULTIPLE_CHOICE" ? MULTIPLE_CHOICE_RESPONDENTS : RESPONDENTS;
    let selection = 0;
    question.options.forEach(([, count], optionIndex) => {
      for (let added = 0; added < count; added++) {
        addAnswer(selection % respondentsForQuestion, optionIndex);
        selection++;
      }
    });
  });

  return { survey, surveyQuestions, surveyOptions, surveyResponses, surveyAnswers };
}
