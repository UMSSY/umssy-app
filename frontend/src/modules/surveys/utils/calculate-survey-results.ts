import type { SurveyTables } from "../types/survey-records.types";
import type { SurveyMetrics, SurveyQuestionResult, SurveyStatistics } from "../types/survey.types";

// Cálculos de HU3 y HU4 a partir de las filas de las tablas. El backend hará lo mismo
// con un groupBy de Prisma; por eso reciben las tablas y no datos ya preparados.

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function toPercentage(part: number, total: number): number {
  return total === 0 ? 0 : roundOneDecimal((part / total) * 100);
}

function getSurveyResponses(tables: SurveyTables, surveyId: string) {
  return tables.surveyResponses.filter((response) => response.surveyId === surveyId);
}

export function calculateSurveyMetrics(tables: SurveyTables, surveyId: string): SurveyMetrics {
  const survey = tables.surveys.find((record) => record.id === surveyId);
  const responses = getSurveyResponses(tables, surveyId);
  const completed = responses.filter((response) => response.completedAt !== null);
  const invitedCount = tables.graduates.filter(
    (graduate) => !survey || survey.targetCareer === null || graduate.career === survey.targetCareer,
  ).length;
  const totalSeconds = completed.reduce(
    (sum, response) => sum + (Date.parse(response.completedAt as string) - Date.parse(response.startedAt)) / 1000,
    0,
  );
  const respondentIds = new Set(responses.map((response) => response.userId));
  const respondents = tables.graduates.filter((graduate) => respondentIds.has(graduate.id));

  return {
    invitedCount,
    respondedCount: responses.length,
    completedCount: completed.length,
    responseRate: toPercentage(responses.length, invitedCount),
    completionRate: toPercentage(completed.length, responses.length),
    averageResponseSeconds: completed.length === 0 ? 0 : Math.round(totalSeconds / completed.length),
    distinctCareers: new Set(respondents.map((graduate) => graduate.career)).size,
    distinctPeriods: new Set(respondents.map((graduate) => graduate.graduationPeriod)).size,
  };
}

export function calculateSurveyStatistics(tables: SurveyTables, surveyId: string): SurveyStatistics | null {
  const survey = tables.surveys.find((record) => record.id === surveyId);
  if (!survey || !survey.period) return null;

  const responseIds = new Set(getSurveyResponses(tables, surveyId).map((response) => response.id));
  const answers = tables.surveyAnswers.filter((answer) => responseIds.has(answer.responseId));

  const questions: SurveyQuestionResult[] = tables.surveyQuestions
    .filter((question) => question.surveyId === surveyId)
    .sort((first, second) => first.order - second.order)
    .map((question) => {
      const questionAnswers = answers.filter((answer) => answer.questionId === question.id);
      const totalSelections = questionAnswers.length;
      // Se parte de todas las opciones configuradas, así las que no tienen respuestas aparecen con 0.
      const options = tables.surveyOptions
        .filter((option) => option.questionId === question.id)
        .sort((first, second) => first.order - second.order)
        .map((option) => {
          const count = questionAnswers.filter((answer) => answer.optionId === option.id).length;
          return { id: option.id, text: option.text, count, percentage: toPercentage(count, totalSelections) };
        });

      return {
        id: question.id,
        order: question.order,
        text: question.text,
        type: question.type,
        isRequired: question.isRequired,
        answeredBy: new Set(questionAnswers.map((answer) => answer.responseId)).size,
        totalSelections,
        options,
      };
    });

  return {
    survey: { id: survey.id, title: survey.title, period: survey.period, targetCareer: survey.targetCareer, status: survey.status },
    totalResponses: responseIds.size,
    questions,
  };
}
