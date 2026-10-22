import type { SurveyRecord, SurveyTables } from "../types/survey-records.types";
import type { SurveyDetail, SurveyListItem, SurveyQuestionInput } from "../types/survey.types";

// Convierte filas de las tablas en la forma que devuelve la API, como harán los mappers del backend.

const UNKNOWN_CREATOR = { fullName: "Administrador", email: "" };

export function toSurveyListItem(tables: SurveyTables, survey: SurveyRecord): SurveyListItem {
  const creator = tables.admins.find((admin) => admin.id === survey.createdById);
  return {
    id: survey.id,
    title: survey.title,
    creator: creator ? { fullName: creator.fullName, email: creator.email } : UNKNOWN_CREATOR,
    period: survey.period,
    createdAt: survey.createdAt,
    status: survey.status,
  };
}

export function toSurveyDetail(tables: SurveyTables, survey: SurveyRecord): SurveyDetail {
  const questions = tables.surveyQuestions
    .filter((question) => question.surveyId === survey.id)
    .sort((first, second) => first.order - second.order)
    .map((question) => ({
      text: question.text,
      type: question.type,
      isRequired: question.isRequired,
      options: tables.surveyOptions
        .filter((option) => option.questionId === question.id)
        .sort((first, second) => first.order - second.order)
        .map((option) => option.text),
    }));

  return {
    id: survey.id,
    status: survey.status,
    title: survey.title,
    description: survey.description,
    targetCareer: survey.targetCareer,
    period: survey.period,
    opensAt: survey.opensAt,
    closesAt: survey.closesAt,
    questions,
  };
}

// Borra las preguntas y opciones de la encuesta y vuelve a insertarlas en el orden recibido,
// igual que haría el backend dentro de una transacción al guardar un borrador.
export function replaceSurveyQuestions(tables: SurveyTables, surveyId: string, questions: SurveyQuestionInput[]): SurveyTables {
  const previousQuestionIds = new Set(
    tables.surveyQuestions.filter((question) => question.surveyId === surveyId).map((question) => question.id),
  );
  const surveyQuestions = tables.surveyQuestions.filter((question) => question.surveyId !== surveyId);
  const surveyOptions = tables.surveyOptions.filter((option) => !previousQuestionIds.has(option.questionId));

  questions.forEach((question, questionIndex) => {
    const questionId = crypto.randomUUID();
    surveyQuestions.push({
      id: questionId,
      surveyId,
      text: question.text.trim(),
      type: question.type,
      isRequired: question.isRequired,
      order: questionIndex + 1,
    });
    question.options.forEach((text, optionIndex) => {
      surveyOptions.push({ id: crypto.randomUUID(), questionId, text: text.trim(), order: optionIndex + 1 });
    });
  });

  return { ...tables, surveyQuestions, surveyOptions };
}
