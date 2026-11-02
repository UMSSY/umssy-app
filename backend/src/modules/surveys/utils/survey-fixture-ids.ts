import type { FixtureContext } from '../../../common/database/fixture-context.js';
import { FIXTURE_USERS } from '../../users/constants/seed-fixture-users.constants.js';
import type { SurveyFixture } from '../types/survey-fixture.type.js';

const MINUTES_PER_DAY = 1440;

export const surveyFixtureId = (
  context: FixtureContext,
  survey: SurveyFixture,
) => context.getId(`survey-${survey.key}`);

export const surveyQuestionFixtureId = (
  context: FixtureContext,
  survey: SurveyFixture,
  questionIndex: number,
) => context.getId(`survey-${survey.key}-question-${questionIndex}`);

export const surveyOptionFixtureId = (
  context: FixtureContext,
  survey: SurveyFixture,
  questionIndex: number,
  optionIndex: number,
) =>
  context.getId(
    `survey-${survey.key}-question-${questionIndex}-option-${optionIndex}`,
  );

export const surveyResponseFixtureId = (
  context: FixtureContext,
  survey: SurveyFixture,
  respondentNumber: number,
) => context.getId(`survey-${survey.key}-response-${respondentNumber}`);

export function fixtureUserIdByNumber(
  context: FixtureContext,
  number: number,
): string {
  const user = FIXTURE_USERS.find(
    (fixtureUser) => fixtureUser.number === number,
  );
  if (!user) throw new Error(`No existe el usuario de prueba ${number}`);
  return context.getId(user.key);
}

export function surveyFixtureDate(context: FixtureContext, days: number): Date;
export function surveyFixtureDate(
  context: FixtureContext,
  days: number | null,
): Date | null;
export function surveyFixtureDate(
  context: FixtureContext,
  days: number | null,
): Date | null {
  return days === null
    ? null
    : context.getDate('anchor', days * MINUTES_PER_DAY, false);
}

export function selectedOptionIndexes(
  respondentNumber: number,
  questionIndex: number,
  optionCount: number,
  isMultipleChoice: boolean,
): number[] {
  const first = (respondentNumber + questionIndex) % optionCount;
  return isMultipleChoice ? [first, (first + 1) % optionCount] : [first];
}
