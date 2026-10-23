import { z } from 'zod';
import { ACADEMIC_PERIOD_PATTERN } from '../../reports/utils/academic-period.js';
import {
  SURVEY_DESCRIPTION_MAX_LENGTH,
  SURVEY_MIN_OPTIONS_TO_PUBLISH,
  SURVEY_MIN_QUESTIONS_TO_PUBLISH,
  SURVEY_OPTION_MAX_LENGTH,
  SURVEY_STATEMENT_MAX_LENGTH,
  SURVEY_TITLE_MAX_LENGTH,
  SURVEY_TITLE_MIN_LENGTH,
  SURVEY_VALIDATION_MESSAGES as MESSAGES,
} from '../constants/survey.constants.js';
import { SURVEY_QUESTION_TYPES, SURVEY_STATUSES } from '../types/survey.enum.js';
import { findDuplicatedLabels } from '../utils/find-duplicated-labels.js';

const optionSchema = z.object({
  label: z
    .string({ message: MESSAGES.OPTION_REQUIRED })
    .trim()
    .min(1, MESSAGES.OPTION_REQUIRED)
    .max(SURVEY_OPTION_MAX_LENGTH, MESSAGES.OPTION_TOO_LONG),
});

const questionSchema = z.object({
  statement: z
    .string({ message: MESSAGES.STATEMENT_REQUIRED })
    .trim()
    .max(SURVEY_STATEMENT_MAX_LENGTH, MESSAGES.STATEMENT_TOO_LONG),
  type: z.enum(SURVEY_QUESTION_TYPES, { message: MESSAGES.INVALID_QUESTION_TYPE }),
  isRequired: z.boolean().default(true),
  options: z.array(optionSchema).default([]),
});

const optionalText = <TSchema extends z.ZodType<string>>(schema: TSchema) =>
  z
    .union([schema, z.literal(''), z.null()])
    .optional()
    .transform((value) => (value ? value : undefined));

const dateSchema = z.iso.datetime({ offset: true, message: MESSAGES.INVALID_DATE });

export const createSurveySchema = z
  .object({
    title: z
      .string({ message: MESSAGES.TITLE_REQUIRED })
      .trim()
      .min(SURVEY_TITLE_MIN_LENGTH, MESSAGES.TITLE_TOO_SHORT)
      .max(SURVEY_TITLE_MAX_LENGTH, MESSAGES.TITLE_TOO_LONG),
    description: z
      .string()
      .trim()
      .max(SURVEY_DESCRIPTION_MAX_LENGTH, MESSAGES.DESCRIPTION_TOO_LONG)
      .nullish()
      .transform((value) => (value ? value : undefined)),
    careerId: optionalText(z.uuid({ message: MESSAGES.INVALID_CAREER_ID })),
    academicPeriod: optionalText(
      z.string().trim().regex(ACADEMIC_PERIOD_PATTERN, MESSAGES.INVALID_ACADEMIC_PERIOD),
    ),
    opensAt: optionalText(dateSchema),
    closesAt: optionalText(dateSchema),
    status: z.enum(SURVEY_STATUSES, { message: MESSAGES.INVALID_STATUS }),
    questions: z.array(questionSchema).default([]),
  })
  .superRefine((survey, ctx) => {
    if (survey.status !== 'published') return;

    const requiredFields = [
      ['careerId', MESSAGES.CAREER_REQUIRED],
      ['academicPeriod', MESSAGES.ACADEMIC_PERIOD_REQUIRED],
      ['opensAt', MESSAGES.OPENS_AT_REQUIRED],
      ['closesAt', MESSAGES.CLOSES_AT_REQUIRED],
    ] as const;

    for (const [field, message] of requiredFields) {
      if (!survey[field]) {
        ctx.addIssue({ code: 'custom', path: [field], message });
      }
    }

    if (survey.questions.length < SURVEY_MIN_QUESTIONS_TO_PUBLISH) {
      ctx.addIssue({
        code: 'custom',
        path: ['questions'],
        message: MESSAGES.QUESTIONS_REQUIRED,
      });
    }

    survey.questions.forEach((question, index) => {
      if (!question.statement) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'statement'],
          message: MESSAGES.STATEMENT_REQUIRED,
        });
      }

      const labels = question.options.map(({ label }) => label);
      if (labels.length < SURVEY_MIN_OPTIONS_TO_PUBLISH) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'options'],
          message: MESSAGES.OPTIONS_TOO_FEW,
        });
      } else if (findDuplicatedLabels(labels).length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'options'],
          message: MESSAGES.OPTIONS_DUPLICATED,
        });
      }
    });
  });

export type CreateSurveyRequest = z.infer<typeof createSurveySchema>;
