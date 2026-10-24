import type { QuestionType } from "../types/survey.types";
import type { SurveyResponseQuestion, SurveyToAnswer } from "../types/survey-response.types";

function buildQuestion(position: number, statement: string, type: QuestionType, labels: string[]): SurveyResponseQuestion {
  return {
    id: `q${position}`,
    position,
    statement,
    type,
    isRequired: true,
    options: labels.map((label, index) => ({ id: `q${position}-o${index + 1}`, label })),
  };
}

const EMPLOYABILITY_QUESTIONS: SurveyResponseQuestion[] = [
  buildQuestion(1, "¿Cuál es tu condición laboral actual?", "single_choice", [
    "Empleado en el sector privado",
    "Empleado en el sector público / Estado",
    "Trabajador independiente / Freelance / Consultor",
    "Emprendedor con empresa propia / Negocio",
    "En búsqueda activa de empleo",
    "No busco empleo por el momento",
  ]),
  buildQuestion(2, "¿Cuánto tiempo tardaste en obtener tu primer empleo profesional tras egresar/titularte?", "single_choice", [
    "Menos de 3 meses",
    "De 3 a 6 meses",
    "De 6 a 12 meses",
    "Más de 12 meses",
    "Aún no he obtenido empleo profesional",
  ]),
  buildQuestion(3, "¿Tu trabajo actual guarda relación con la carrera de Sistemas?", "single_choice", [
    "Altamente relacionada",
    "Moderadamente relacionada",
    "Baja relación",
    "No está relacionada",
  ]),
  buildQuestion(4, "¿Cuál es tu rango de ingreso mensual bruto (en Bs)?", "single_choice", [
    "0 - 2,000 Bs",
    "2,001 - 4,000 Bs",
    "4,001 - 8,000 Bs",
    "Mayor a 8,000 Bs",
  ]),
  buildQuestion(5, "¿En qué área o rol técnico te desempeñas principalmente?", "single_choice", [
    "Desarrollo de Software (Backend / Frontend / Fullstack)",
    "Datos e Inteligencia Artificial",
    "Infraestructura, DevOps y Ciberseguridad",
    "Gestión de Proyectos / Liderazgo TI",
    "Otra área / No aplica",
  ]),
  buildQuestion(6, "¿Consideras que la formación recibida en la universidad se ajusta a las exigencias del mercado?", "single_choice", [
    "Totalmente desacuerdo",
    "En desacuerdo",
    "Neutro",
    "De acuerdo",
    "Totalmente de acuerdo",
  ]),
];

const FOLLOW_UP_QUESTIONS: SurveyResponseQuestion[] = [
  buildQuestion(1, "¿Qué estudios realizaste después de titularte?", "multiple_choice", [
    "Diplomado",
    "Maestría",
    "Doctorado",
    "Certificaciones técnicas",
    "Ninguno",
  ]),
  buildQuestion(2, "¿Recomendarías la carrera a otras personas?", "single_choice", ["Sí", "No", "No estoy seguro"]),
];

// Datos de ejemplo hasta que exista el endpoint del titulado. Las claves son ids de encuesta.
export const SAMPLE_SURVEYS_TO_ANSWER: Record<string, SurveyToAnswer> = {
  "employability-2026": {
    id: "employability-2026",
    title: "Encuesta de empleabilidad",
    description: "Ayúdanos a conocer tu situación laboral actual para el seguimiento de egresados.",
    questions: EMPLOYABILITY_QUESTIONS,
  },
  "graduate-follow-up": {
    id: "graduate-follow-up",
    title: "Encuesta de seguimiento a titulados",
    description: "Cuéntanos cómo ha sido tu trayectoria después de titularte.",
    questions: FOLLOW_UP_QUESTIONS,
  },
};
