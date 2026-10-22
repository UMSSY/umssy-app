import type { SurveyQuestionInput } from "../types/survey.types";

// TODO: eliminar con el almacén de ejemplo. Plantillas para que las encuestas de ejemplo
// tengan preguntas distintas entre sí y en distinta cantidad.

const EMPLOYABILITY: SurveyQuestionInput[] = [
  {
    text: "¿Cuál es tu condición laboral actual?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: [
      "Empleado en el sector privado",
      "Empleado en el sector público / Estado",
      "Independiente / Freelance / Consultor",
      "Emprendedor con empresa propia",
      "En búsqueda activa de empleo",
      "No busca empleo por el momento",
    ],
  },
  {
    text: "¿Cuánto tiempo tardaste en obtener tu primer empleo profesional?",
    type: "DROPDOWN",
    isRequired: true,
    options: ["Ya trabajaba", "Menos de 2 meses", "De 2 a 6 meses", "De 6 a 12 meses", "Más de 12 meses", "Aún no lo obtengo"],
  },
  {
    text: "¿Tu trabajo actual guarda relación con tu carrera?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: ["Altamente", "Moderadamente", "Baja relación", "No relacionada"],
  },
  {
    text: "¿Cuál es tu rango de ingreso mensual bruto (en Bs)?",
    type: "DROPDOWN",
    isRequired: true,
    options: ["0 - 2.000 Bs", "2.001 - 4.000 Bs", "4.001 - 8.000 Bs", "Mayor a 8.000 Bs"],
  },
  {
    text: "¿En qué áreas técnicas te desempeñas?",
    type: "MULTIPLE_CHOICE",
    isRequired: true,
    options: [
      "Desarrollo de software",
      "Datos e inteligencia artificial",
      "Infraestructura, DevOps y ciberseguridad",
      "Gestión de proyectos / Liderazgo TI",
      "Otra área",
    ],
  },
  {
    text: "¿La formación recibida se ajusta a las exigencias del mercado?",
    type: "SINGLE_CHOICE",
    isRequired: false,
    options: ["De acuerdo", "En desacuerdo", "Parcialmente", "No estoy seguro"],
  },
];

const SATISFACTION: SurveyQuestionInput[] = [
  {
    text: "¿Qué tan satisfecho estás con la formación recibida?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: ["Muy satisfecho", "Satisfecho", "Neutral", "Insatisfecho", "Muy insatisfecho"],
  },
  {
    text: "¿Qué aspectos de la carrera deberían mejorar?",
    type: "MULTIPLE_CHOICE",
    isRequired: true,
    options: [
      "Contenido de las materias",
      "Prácticas profesionales",
      "Infraestructura y laboratorios",
      "Idiomas",
      "Vinculación con empresas",
      "Habilidades blandas",
    ],
  },
  {
    text: "¿Recomendarías la carrera a otras personas?",
    type: "SINGLE_CHOICE",
    isRequired: false,
    options: ["Sí", "No", "Tal vez"],
  },
];

const POSTGRADUATE: SurveyQuestionInput[] = [
  {
    text: "¿Realizaste o realizas estudios de posgrado?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: ["Sí, concluidos", "Sí, en curso", "No, pero lo planeo", "No lo planeo"],
  },
  {
    text: "¿Qué tipo de posgrado te interesa más?",
    type: "DROPDOWN",
    isRequired: true,
    options: ["Diplomado", "Especialidad", "Maestría", "Doctorado", "Ninguno"],
  },
  {
    text: "¿Cómo financiarías tus estudios de posgrado?",
    type: "MULTIPLE_CHOICE",
    isRequired: false,
    options: ["Recursos propios", "Beca", "Apoyo del empleador", "Crédito educativo"],
  },
  {
    text: "¿En qué áreas te gustaría especializarte?",
    type: "MULTIPLE_CHOICE",
    isRequired: true,
    options: ["Ingeniería de software", "Ciencia de datos", "Ciberseguridad", "Gestión de TI", "Investigación"],
  },
];

const ENTREPRENEURSHIP: SurveyQuestionInput[] = [
  {
    text: "¿Tienes un emprendimiento propio?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: ["Sí, activo", "Lo tuve, pero cerró", "No"],
  },
  {
    text: "¿En qué sector está tu emprendimiento o el que te gustaría iniciar?",
    type: "DROPDOWN",
    isRequired: true,
    options: ["Software a medida", "Comercio electrónico", "Educación", "Salud", "Servicios financieros", "Otro sector"],
  },
  {
    text: "¿Cuántas personas trabajan en tu emprendimiento?",
    type: "DROPDOWN",
    isRequired: false,
    options: ["Solo yo", "De 2 a 5", "De 6 a 20", "Más de 20"],
  },
  {
    text: "¿Cuáles son los principales obstáculos para emprender?",
    type: "MULTIPLE_CHOICE",
    isRequired: true,
    options: ["Financiamiento", "Trámites", "Falta de mentoría", "Mercado reducido", "Competencia"],
  },
  {
    text: "¿La universidad te dio herramientas para emprender?",
    type: "SINGLE_CHOICE",
    isRequired: true,
    options: ["Muchas", "Algunas", "Pocas", "Ninguna"],
  },
];

export const SURVEY_TEMPLATES: SurveyQuestionInput[][] = [EMPLOYABILITY, SATISFACTION, POSTGRADUATE, ENTREPRENEURSHIP];
