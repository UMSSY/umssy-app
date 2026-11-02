import { z } from 'zod';
import { SURVEY_VALIDATION_MESSAGES } from '../constants/survey.constants.js';

export const surveyIdSchema = z.uuid({
  error: SURVEY_VALIDATION_MESSAGES.INVALID_SURVEY_ID,
});
