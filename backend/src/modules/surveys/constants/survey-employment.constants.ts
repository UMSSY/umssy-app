import type { Prisma } from '../../../prisma/client.js';

export const EMPLOYMENT_STATUS_QUESTION =
  '¿Cuál es tu situación laboral actual respecto a tu carrera?';
export const MONTHLY_SALARY_QUESTION = '¿Cuál es tu rango salarial mensual?';

export const SURVEY_EMPLOYMENT_RESPONSE_SELECT = {
  respondentId: true,
  submittedAt: true,
  answers: {
    where: {
      question: {
        statement: {
          in: [EMPLOYMENT_STATUS_QUESTION, MONTHLY_SALARY_QUESTION],
        },
      },
    },
    select: {
      question: { select: { statement: true } },
      option: { select: { label: true } },
    },
  },
} satisfies Prisma.SurveyResponseSelect;
