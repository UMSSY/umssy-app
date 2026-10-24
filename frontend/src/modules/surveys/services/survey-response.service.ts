import { SAMPLE_SURVEYS_TO_ANSWER } from "../constants/sample-surveys-to-answer.constants";
import type { SurveyAnswers, SurveyToAnswer } from "../types/survey-response.types";

// TODO: conectar con los endpoints del titulado (obtener la encuesta y registrar respuestas) cuando existan en el backend.
export const surveyResponseService = {
  // null cuando la encuesta no existe.
  getSurveyToAnswer: async (surveyId: string): Promise<SurveyToAnswer | null> => SAMPLE_SURVEYS_TO_ANSWER[surveyId] ?? null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  submitAnswers: async (_surveyId: string, _answers: SurveyAnswers): Promise<void> => undefined,
};
