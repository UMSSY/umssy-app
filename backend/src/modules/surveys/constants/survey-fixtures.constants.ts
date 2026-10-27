import type { SurveyFixture } from '../types/survey-fixture.type.js';
import { SurveyQuestionType, SurveyStatus } from '../types/survey.enum.js';

const SYSTEMS_CAREER = 'Licenciatura en Ingeniería de Sistemas';
const INFORMATICS_CAREER = 'Licenciatura Ingeniería en Informática';

export const SURVEY_FIXTURES: readonly SurveyFixture[] = [
  {
    key: 'employability-2020',
    title: 'Encuesta de empleabilidad 2020',
    description:
      'Conoce la situación laboral de los titulados de la gestión 2020.',
    career: SYSTEMS_CAREER,
    academicPeriod: '2020',
    status: SurveyStatus.PUBLISHED,
    opensAtDays: -7,
    closesAtDays: 365,
    createdAtDays: -10,
    questions: [
      {
        statement: '¿Cuál es tu situación laboral actual?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        isRequired: true,
        options: [
          'Empleado a tiempo completo',
          'Empleado a medio tiempo',
          'Trabajador independiente',
          'Buscando empleo',
        ],
      },
      {
        statement: '¿Cuánto tiempo tardaste en conseguir tu primer empleo?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        isRequired: true,
        options: [
          'Menos de 3 meses',
          'Entre 3 y 6 meses',
          'Entre 6 y 12 meses',
          'Más de un año',
        ],
      },
      {
        statement: '¿Qué competencias usas con más frecuencia en tu trabajo?',
        type: SurveyQuestionType.MULTIPLE_CHOICE,
        isRequired: false,
        options: [
          'Programación',
          'Bases de datos',
          'Gestión de proyectos',
          'Redes e infraestructura',
        ],
      },
    ],
    respondentNumbers: [22, 24, 26, 28, 30],
  },
  {
    key: 'graduate-follow-up',
    title: 'Seguimiento laboral de titulados',
    description:
      'Seguimiento de la relación entre el trabajo actual y la carrera.',
    career: INFORMATICS_CAREER,
    academicPeriod: 'Todas',
    status: SurveyStatus.PUBLISHED,
    opensAtDays: -5,
    closesAtDays: 365,
    createdAtDays: -6,
    questions: [
      {
        statement: '¿Tu trabajo actual está relacionado con tu carrera?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        isRequired: true,
        options: [
          'Totalmente relacionado',
          'Parcialmente relacionado',
          'No está relacionado',
        ],
      },
      {
        statement: '¿En qué rango está tu ingreso mensual?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        isRequired: true,
        options: ['Menos de 3000 Bs', 'Entre 3000 y 6000 Bs', 'Más de 6000 Bs'],
      },
    ],
    respondentNumbers: [21, 23, 25],
  },
  {
    key: 'job-placement-2020',
    title: 'Inserción laboral 2020',
    description: 'Experiencia laboral de los titulados durante sus estudios.',
    career: SYSTEMS_CAREER,
    academicPeriod: '2020',
    status: SurveyStatus.PUBLISHED,
    opensAtDays: -60,
    closesAtDays: -30,
    createdAtDays: -62,
    questions: [
      {
        statement: '¿Trabajaste durante tus estudios?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        isRequired: true,
        options: ['Sí', 'No'],
      },
    ],
    respondentNumbers: [22, 24],
  },
  {
    key: 'training-satisfaction',
    title: 'Satisfacción con la formación recibida',
    description: 'Valoración de la formación recibida durante la carrera.',
    career: INFORMATICS_CAREER,
    academicPeriod: '2020',
    status: SurveyStatus.DRAFT,
    opensAtDays: null,
    closesAtDays: null,
    createdAtDays: -2,
    questions: [
      {
        statement: '¿Cómo calificas la formación recibida?',
        type: SurveyQuestionType.SINGLE_CHOICE,
        isRequired: true,
        options: ['Excelente', 'Buena', 'Regular', 'Deficiente'],
      },
    ],
    respondentNumbers: [],
  },
];
